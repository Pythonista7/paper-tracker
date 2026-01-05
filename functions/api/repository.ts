import { Env, Note, Paper, PaperStatus, ReadingSession, ShareToken } from './types';
import { NoteInput, PaperInput, PaperUpdateInput } from './validation';

const PAPER_SELECT = `
  SELECT id, title, authors, abstract, source_url as sourceUrl,
         canonical_id as canonicalId, status, tags, created_at as createdAt,
         updated_at as updatedAt
  FROM papers
`;

type PaperRow = {
  id: string;
  title: string;
  authors: string;
  abstract: string;
  sourceUrl: string;
  canonicalId: string;
  status: PaperStatus;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
};

type NoteRow = {
  id: string;
  paperId: string;
  body: string;
  pageRef: string | null;
  sectionRef: string | null;
  createdAt: string;
  updatedAt: string;
};

type SessionRow = {
  id: string;
  paperId: string;
  startedAt: string;
  endedAt: string | null;
  progress: number | null;
};

const parseTags = (value: string | null): string[] => {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error('Unable to parse tags', error);
    return [];
  }
};

const mapPaper = (row: PaperRow): Paper => ({
  ...row,
  tags: parseTags(row.tags)
});

const mapNote = (row: NoteRow): Note => ({
  ...row,
  pageRef: row.pageRef || undefined,
  sectionRef: row.sectionRef || undefined
});

const mapSession = (row: SessionRow): ReadingSession => ({
  ...row,
  endedAt: row.endedAt ?? undefined,
  progress: row.progress ?? 0
});

export async function listPapers(env: Env, params: { search?: string; status?: PaperStatus; tag?: string } = {}) {
  const conditions: string[] = [];
  const bindings: (string)[] = [];

  if (params.search) {
    conditions.push('(title LIKE ? OR authors LIKE ? OR abstract LIKE ?)');
    const like = `%${params.search}%`;
    bindings.push(like, like, like);
  }

  if (params.status) {
    conditions.push('status = ?');
    bindings.push(params.status);
  }

  if (params.tag) {
    conditions.push('tags LIKE ?');
    bindings.push(`%"${params.tag}"%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const query = `${PAPER_SELECT} ${where} ORDER BY datetime(updated_at) DESC`;
  const { results } = await env.DB.prepare(query).bind(...bindings).all<PaperRow>();
  return (results ?? []).map(mapPaper);
}

export async function getPaper(env: Env, id: string) {
  const { results } = await env.DB.prepare(`${PAPER_SELECT} WHERE id = ?`).bind(id).all<PaperRow>();
  return results?.[0] ? mapPaper(results[0]) : null;
}

export async function createPaper(env: Env, payload: PaperInput) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO papers (id, title, authors, abstract, source_url, canonical_id, status, tags, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      payload.title,
      payload.authors ?? '',
      payload.abstract ?? '',
      payload.sourceUrl,
      payload.canonicalId ?? '',
      payload.status ?? 'to-read',
      JSON.stringify(payload.tags ?? []),
      now,
      now
    )
    .run();

  return getPaper(env, id);
}

export async function updatePaper(env: Env, id: string, payload: PaperUpdateInput) {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (payload.title !== undefined) {
    fields.push('title = ?');
    values.push(payload.title);
  }
  if (payload.authors !== undefined) {
    fields.push('authors = ?');
    values.push(payload.authors);
  }
  if (payload.abstract !== undefined) {
    fields.push('abstract = ?');
    values.push(payload.abstract);
  }
  if (payload.sourceUrl !== undefined) {
    fields.push('source_url = ?');
    values.push(payload.sourceUrl);
  }
  if (payload.canonicalId !== undefined) {
    fields.push('canonical_id = ?');
    values.push(payload.canonicalId);
  }
  if (payload.status !== undefined) {
    fields.push('status = ?');
    values.push(payload.status);
  }
  if (payload.tags !== undefined) {
    fields.push('tags = ?');
    values.push(JSON.stringify(payload.tags));
  }

  if (!fields.length) {
    return getPaper(env, id);
  }

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  await env.DB.prepare(`UPDATE papers SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  return getPaper(env, id);
}

export async function deletePaper(env: Env, id: string) {
  await env.DB.prepare('DELETE FROM papers WHERE id = ?').bind(id).run();
}

export async function listNotes(env: Env, paperId: string) {
  const { results } = await env.DB.prepare(
    `SELECT id, paper_id as paperId, body, page_ref as pageRef, section_ref as sectionRef, created_at as createdAt, updated_at as updatedAt
     FROM notes WHERE paper_id = ? ORDER BY datetime(updated_at) DESC`
  )
    .bind(paperId)
    .all<NoteRow>();

  return (results ?? []).map(mapNote);
}

export async function createNote(env: Env, paperId: string, payload: NoteInput) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO notes (id, paper_id, body, page_ref, section_ref, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, paperId, payload.body, payload.pageRef ?? '', payload.sectionRef ?? '', now, now)
    .run();

  return listNotes(env, paperId);
}

export async function updateNote(env: Env, noteId: string, payload: NoteInput) {
  const now = new Date().toISOString();
  await env.DB.prepare(
    `UPDATE notes SET body = ?, page_ref = ?, section_ref = ?, updated_at = ? WHERE id = ?`
  )
    .bind(payload.body, payload.pageRef ?? '', payload.sectionRef ?? '', now, noteId)
    .run();

  const { results } = await env.DB.prepare(
    `SELECT id, paper_id as paperId, body, page_ref as pageRef, section_ref as sectionRef, created_at as createdAt, updated_at as updatedAt FROM notes WHERE id = ?`
  )
    .bind(noteId)
    .all<NoteRow>();

  return results?.[0] ? mapNote(results[0]) : null;
}

export async function deleteNote(env: Env, noteId: string) {
  await env.DB.prepare('DELETE FROM notes WHERE id = ?').bind(noteId).run();
}

export async function listSessions(env: Env, paperId: string) {
  const { results } = await env.DB.prepare(
    `SELECT id, paper_id as paperId, started_at as startedAt, ended_at as endedAt, progress
     FROM reading_sessions WHERE paper_id = ? ORDER BY datetime(started_at) DESC`
  )
    .bind(paperId)
    .all<SessionRow>();

  return (results ?? []).map(mapSession);
}

export async function createSession(env: Env, payload: { paperId: string; startedAt: string; endedAt?: string; progress?: number }) {
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO reading_sessions (id, paper_id, started_at, ended_at, progress)
     VALUES (?, ?, ?, ?, ?)`
  )
    .bind(id, payload.paperId, payload.startedAt, payload.endedAt ?? null, payload.progress ?? null)
    .run();

  return listSessions(env, payload.paperId);
}

export async function upsertShareToken(env: Env, paperId: string, isPublic: boolean) {
  const token = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO share_tokens (paper_id, token, is_public)
     VALUES (?, ?, ?)
     ON CONFLICT(paper_id, token) DO UPDATE SET is_public = excluded.is_public`
  )
    .bind(paperId, token, isPublic ? 1 : 0)
    .run();

  const { results } = await env.DB.prepare(
    `SELECT paper_id as paperId, token, is_public as isPublic, created_at as createdAt FROM share_tokens WHERE paper_id = ? ORDER BY datetime(created_at) DESC LIMIT 1`
  )
    .bind(paperId)
    .all<ShareToken>();

  return results?.[0] ?? null;
}

export async function getShareToken(env: Env, token: string) {
  const { results } = await env.DB.prepare(
    `SELECT paper_id as paperId, token, is_public as isPublic, created_at as createdAt FROM share_tokens WHERE token = ?`
  )
    .bind(token)
    .all<ShareToken>();
  return results?.[0] ?? null;
}

export async function getDashboard(env: Env) {
  const statusCounts = await env.DB.prepare(
    `SELECT status, COUNT(*) as count FROM papers GROUP BY status`
  ).all<{ status: PaperStatus; count: number }>();

  const recentNotes = await env.DB.prepare(
    `SELECT n.id, n.paper_id as paperId, n.body, n.page_ref as pageRef, n.section_ref as sectionRef, n.created_at as createdAt, n.updated_at as updatedAt,
            p.title as paperTitle, p.authors as paperAuthors
     FROM notes n
     JOIN papers p ON n.paper_id = p.id
     ORDER BY datetime(n.updated_at) DESC LIMIT 5`
  ).all<NoteRow & { paperTitle: string; paperAuthors: string }>();

  return {
    statuses: statusCounts.results ?? [],
    recentNotes: (recentNotes.results ?? []).map((row) => ({
      ...mapNote(row),
      paperTitle: row.paperTitle,
      paperAuthors: row.paperAuthors
    }))
  };
}
