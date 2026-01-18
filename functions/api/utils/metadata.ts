import { Env } from '../types';

export interface MetadataResult {
  title?: string;
  abstract?: string;
  authors?: string;
  tags?: string[];
  publishedAt?: string;
  canonicalId?: string;
}

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

function parseArxivXml(xml: string): MetadataResult | null {
  const entryMatch = xml.match(/<entry>([\s\S]*?)<\/entry>/);
  if (!entryMatch) return null;
  const entry = entryMatch[1];

  const titleMatch = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : undefined;

  const summaryMatch = entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);
  const abstract = summaryMatch ? summaryMatch[1].replace(/\s+/g, ' ').trim() : undefined;

  const publishedMatch = entry.match(/<published>([\s\S]*?)<\/published>/);
  const publishedAt = publishedMatch ? publishedMatch[1].trim() : undefined;

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
    publishedAt,
    tags: categories
  };
}

async function fetchArxivMetadata(id: string): Promise<MetadataResult | null> {
  const response = await fetch(`https://export.arxiv.org/api/query?id_list=${id}`);
  if (!response.ok) return null;
  const xml = await response.text();
  const data = parseArxivXml(xml);
  if (data) {
    return { ...data, canonicalId: id };
  }
  return null;
}

async function fetchGenericMetadata(url: string): Promise<MetadataResult | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: { 'User-Agent': 'PaperTracker/1.0' }
    });
    clearTimeout(timeout);
    
    if (!response.ok) return null;
    const html = await response.text();

    const titleMatch = html.match(/<title>([^<]*)<\/title>/i) || html.match(/<meta property="og:title" content="([^"]*)"/i);
    const title = titleMatch ? titleMatch[1].trim() : undefined;

    const descMatch = html.match(/<meta name="description" content="([^"]*)"/i) || html.match(/<meta property="og:description" content="([^"]*)"/i);
    const abstract = descMatch ? descMatch[1].trim() : undefined;

    // Try to find a date
    const dateMatch = html.match(/<meta name="date" content="([^"]*)"/i) || 
                      html.match(/<meta property="article:published_time" content="([^"]*)"/i) ||
                       html.match(/"datePublished":\s*"([^"]*)"/); // Schema.org
    
    const publishedAt = dateMatch ? dateMatch[1].trim() : undefined;

    return { title, abstract, publishedAt };
  } catch (e) {
    console.error('Failed to fetch generic metadata', e);
    return null;
  }
}

export async function resolveMetadata(env: Env, sourceUrl: string, bustCache = false): Promise<MetadataResult | null> {
  if (!bustCache) {
    const cached = await env.PAPER_CACHE.get(cacheKey(sourceUrl));
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Validate that cache has all expected fields - if publishedAt is missing for arXiv, re-fetch
        const arxivId = extractArxivId(sourceUrl);
        if (arxivId && !parsed.publishedAt) {
          // Old cache format missing publishedAt, re-fetch
        } else if (typeof parsed === 'object') {
          return parsed;
        }
      } catch (e) {}
    }
  }

  let result: MetadataResult | null = null;
  const arxivId = extractArxivId(sourceUrl);
  
  if (arxivId) {
    result = await fetchArxivMetadata(arxivId);
  } else {
    result = await fetchGenericMetadata(sourceUrl);
  }

  if (result) {
    // Cache for 24 hours
    await env.PAPER_CACHE.put(cacheKey(sourceUrl), JSON.stringify(result), { expirationTtl: 86400 });
  }

  return result;
}
