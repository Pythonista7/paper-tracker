import { Hono } from 'hono';
import { Env, PaperStatus } from './types';
import type { ExecutionContext, PagesFunction } from '@cloudflare/workers-types';
import {
  createNote,
  createPaper,
  createSession,
  deleteNote,
  deletePaper,
  getDashboard,
  getPaper,
  getShareToken,
  listNotes,
  listPapers,
  listSessions,
  updateNote,
  updatePaper,
  upsertShareToken
} from './repository';
import { noteInputSchema, paperInputSchema, paperUpdateSchema, sessionInputSchema } from './validation';
import { z } from 'zod';
import {
  checkRateLimit,
  clearSessionCookie,
  createSession as createAuthSession,
  deleteSession,
  getClientIP,
  getSessionToken,
  requireAuth,
  setSessionCookie,
  validateSession,
  verifyPassword
} from './auth';

const app = new Hono<{ Bindings: Env }>();

const STATUS_VALUES: PaperStatus[] = ['to-read', 'in-progress', 'needs-review', 'done'];

const metadataSchema = z.object({
  sourceUrl: z.string().url(),
  title: z.string().optional(),
  authors: z.string().optional(),
  abstract: z.string().optional(),
  canonicalId: z.string().optional()
});

const cacheKey = (url: string) => `paper-meta:${url}`;

function extractArxivId(url: string): string | null {
  const cleanUrl = url.split('?')[0].replace(/\.pdf$/, '');
  const regex = /arxiv\.org\/(?:abs|pdf)\/((?:[\w-]+\/)?[\d.]+(?:v\d+)?)/;
  const match = cleanUrl.match(regex);
  if (match && match[1]) {
    return match[1].replace(/\.$/, '');
  }
  return null;
}

function parseArxivXml(xml: string) {
  const entryMatch = xml.match(/<entry>([\s\S]*?)<\/entry>/);
  if (!entryMatch) return null;
  const entry = entryMatch[1];

  const titleMatch = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';

  const summaryMatch = entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);
  const abstract = summaryMatch ? summaryMatch[1].replace(/\s+/g, ' ').trim() : '';

  const authorMatches = entry.matchAll(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g);
  const authors = Array.from(authorMatches).map(m => m[1].trim()).join(', ');

  const categories: string[] = [];
  const catRegex = /<category[^>]*term="([^"]*)"/g;
  let catMatch;
  while ((catMatch = catRegex.exec(entry)) !== null) {
      categories.push(catMatch[1]);
  }

  return {
    title,
    abstract,
    authors,
    tags: categories
  };
}

async function fetchArxivMetadata(id: string) {
  const response = await fetch(`https://export.arxiv.org/api/query?id_list=${id}`);
  if (!response.ok) return null;
  const xml = await response.text();
  return parseArxivXml(xml);
}

async function resolveMetadata(env: Env, payload: z.infer<typeof metadataSchema>) {
  const cached = await env.PAPER_CACHE.get(cacheKey(payload.sourceUrl));
  if (cached) {
    const parsed = JSON.parse(cached);
    // If the cached title is just the URL, it's likely a failed fetch from before.
    // We should try to fetch again.
    if (parsed.title !== payload.sourceUrl) {
      return parsed;
    }
  }

  let metadata = {
    title: payload.title ?? payload.sourceUrl,
    authors: payload.authors ?? '',
    abstract: payload.abstract ?? '',
    canonicalId: payload.canonicalId ?? '',
    tags: [] as string[]
  };

  const arxivId = extractArxivId(payload.sourceUrl);
  if (arxivId) {
    try {
      const arxivMeta = await fetchArxivMetadata(arxivId);
      if (arxivMeta) {
        metadata = {
          title: arxivMeta.title || metadata.title,
          authors: arxivMeta.authors || metadata.authors,
          abstract: arxivMeta.abstract || metadata.abstract,
          canonicalId: arxivId,
          tags: arxivMeta.tags || []
        };
      }
    } catch (e) {
      console.error('Failed to fetch arXiv metadata', e);
    }
  }

  await env.PAPER_CACHE.put(cacheKey(payload.sourceUrl), JSON.stringify(metadata), {
    expirationTtl: 60 * 60 * 24 * 30
  });

  return metadata;
}

app.get('/', (c) => c.json({ ok: true, service: c.env.APP_NAME }));

// Auth endpoints
app.post('/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }
    
    // Check rate limit
    const ip = getClientIP(c);
    const rateLimit = await checkRateLimit(c.env, ip);
    
    if (!rateLimit.allowed) {
      return c.json({ 
        error: 'Too many login attempts. Please try again later.',
        retryAfter: 3600 
      }, 429);
    }
    
    // Verify credentials
    const adminEmail = c.env.ADMIN_EMAIL;
    const adminPasswordHash = c.env.ADMIN_PASSWORD_HASH;
    
    if (!adminEmail || !adminPasswordHash) {
      return c.json({ error: 'Authentication not configured' }, 500);
    }
    
    if (email !== adminEmail) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    const isValidPassword = await verifyPassword(password, adminPasswordHash);
    
    if (!isValidPassword) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Create session
    const token = await createAuthSession(c.env, email);
    
    // Set cookie
    const cookie = setSessionCookie(token);
    
    return c.json({ success: true, email }, 200, {
      'Set-Cookie': cookie
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

app.get('/auth/check', async (c) => {
  const token = getSessionToken(c);
  const session = await validateSession(c.env, token);
  
  if (!session) {
    return c.json({ authenticated: false }, 200);
  }
  
  return c.json({ 
    authenticated: true, 
    email: session.email 
  });
});

app.post('/auth/logout', async (c) => {
  const token = getSessionToken(c);
  
  if (token) {
    await deleteSession(c.env, token);
  }
  
  const cookie = clearSessionCookie();
  
  return c.json({ success: true }, 200, {
    'Set-Cookie': cookie
  });
});

app.get('/papers', async (c) => {
  const search = c.req.query('q') ?? undefined;
  const statusParam = c.req.query('status');
  const status = STATUS_VALUES.includes(statusParam as PaperStatus) ? (statusParam as PaperStatus) : undefined;
  const tag = c.req.query('tag') ?? undefined;
  const papers = await listPapers(c.env, { search, status, tag });
  return c.json(papers);
});

app.get('/papers/:id', async (c) => {
  const paper = await getPaper(c.env, c.req.param('id'));
  if (!paper) return c.json({ error: 'Paper not found' }, 404);
  return c.json(paper);
});

app.post('/papers', async (c) => {
  const authError = await requireAuth(c);
  if (authError) return authError;
  
  const body = await c.req.json();
  const parsed = paperInputSchema.parse(body);
  const paper = await createPaper(c.env, parsed);
  return c.json(paper, 201);
});

app.patch('/papers/:id', async (c) => {
  const authError = await requireAuth(c);
  if (authError) return authError;
  
  const body = await c.req.json();
  const parsed = paperUpdateSchema.parse(body);
  const paper = await updatePaper(c.env, c.req.param('id'), parsed);
  if (!paper) return c.json({ error: 'Paper not found' }, 404);
  return c.json(paper);
});

app.delete('/papers/:id', async (c) => {
  const authError = await requireAuth(c);
  if (authError) return authError;
  
  await deletePaper(c.env, c.req.param('id'));
  return c.json({ ok: true });
});

app.post('/papers/:id/share', async (c) => {
  const { isPublic } = await c.req.json();
  const token = await upsertShareToken(c.env, c.req.param('id'), Boolean(isPublic));
  return c.json(token);
});

app.get('/shared/:token', async (c) => {
  const token = await getShareToken(c.env, c.req.param('token'));
  if (!token || !token.isPublic) return c.json({ error: 'Share token not found' }, 404);
  const paper = await getPaper(c.env, token.paperId);
  if (!paper) return c.json({ error: 'Paper not found' }, 404);
  const notes = await listNotes(c.env, token.paperId);
  return c.json({ paper, notes });
});

app.get('/papers/:id/notes', async (c) => {
  const notes = await listNotes(c.env, c.req.param('id'));
  return c.json(notes);
});

app.post('/papers/:id/notes', async (c) => {
  const authError = await requireAuth(c);
  if (authError) return authError;
  
  const paperId = c.req.param('id');
  const body = await c.req.json();
  const parsed = noteInputSchema.parse(body);
  const notes = await createNote(c.env, paperId, parsed);
  return c.json(notes, 201);
});

app.patch('/notes/:noteId', async (c) => {
  const authError = await requireAuth(c);
  if (authError) return authError;
  
  const body = await c.req.json();
  const parsed = noteInputSchema.parse(body);
  const note = await updateNote(c.env, c.req.param('noteId'), parsed);
  if (!note) return c.json({ error: 'Note not found' }, 404);
  return c.json(note);
});

app.delete('/notes/:noteId', async (c) => {
  const authError = await requireAuth(c);
  if (authError) return authError;
  
  await deleteNote(c.env, c.req.param('noteId'));
  return c.json({ ok: true });
});

app.get('/papers/:id/sessions', async (c) => {
  const sessions = await listSessions(c.env, c.req.param('id'));
  return c.json(sessions);
});

app.post('/sessions', async (c) => {
  const authError = await requireAuth(c);
  if (authError) return authError;
  
  const body = await c.req.json();
  const parsed = sessionInputSchema.parse(body);
  const sessions = await createSession(c.env, parsed);
  return c.json(sessions, 201);
});

app.get('/dashboard', async (c) => {
  const dashboard = await getDashboard(c.env);
  return c.json(dashboard);
});

app.post('/papers/ingest', async (c) => {
  const body = await c.req.json();
  const parsed = metadataSchema.parse(body);
  const metadata = await resolveMetadata(c.env, parsed);
  return c.json(metadata);
});

app.post('/images/upload', async (c) => {
  const authError = await requireAuth(c);
  if (authError) return authError;

  const formData = await c.req.formData();
  const file = formData.get('image') as File;
  
  if (!file) {
    return c.json({ error: 'No image file provided' }, 400);
  }

  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: 'Invalid file type. Only PNG, JPEG, GIF, and WebP are allowed.' }, 400);
  }

  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return c.json({ error: 'File too large. Maximum size is 10MB.' }, 400);
  }

  // Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = file.name.split('.').pop() || 'png';
  const filename = `${timestamp}-${randomString}.${extension}`;

  try {
    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await c.env.IMAGES.put(filename, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Return public URL
    const imageUrl = `/api/images/${filename}`;
    return c.json({ url: imageUrl }, 201);
  } catch (error) {
    console.error('Error uploading image:', error);
    return c.json({ error: 'Failed to upload image' }, 500);
  }
});

app.get('/images/:filename', async (c) => {
  const filename = c.req.param('filename');
  
  try {
    const object = await c.env.IMAGES.get(filename);
    
    if (!object) {
      return c.json({ error: 'Image not found' }, 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Error retrieving image:', error);
    return c.json({ error: 'Failed to retrieve image' }, 500);
  }
});

export const onRequest: PagesFunction<Env> = (context) => {
  const url = new URL(context.request.url);
  if (url.pathname.startsWith('/api')) {
    url.pathname = url.pathname.replace('/api', '') || '/';
  }
  const request = new Request(url, context.request);
  const bindings: Env = {
    ...(context.env as Env),
    DB: (context.env as Env).DB ?? (context.env as any).paper_tracker
  };
  return app.fetch(request, bindings, context as unknown as ExecutionContext);
};
