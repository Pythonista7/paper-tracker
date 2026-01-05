export type PaperStatus = 'to-read' | 'in-progress' | 'done' | 'needs-review';

export interface Paper {
  id: string;
  title: string;
  authors: string;
  abstract: string;
  sourceUrl: string;
  canonicalId: string;
  status: PaperStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  paperId: string;
  body: string;
  pageRef?: string;
  sectionRef?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingSession {
  id: string;
  paperId: string;
  startedAt: string;
  endedAt?: string;
  progress: number;
}

export interface Tag {
  id: string;
  label: string;
}

export interface ShareToken {
  paperId: string;
  token: string;
  isPublic: boolean;
  createdAt: string;
}

export interface Env {
  DB: D1Database;
  PAPER_CACHE: KVNamespace;
  APP_NAME: string;
}
