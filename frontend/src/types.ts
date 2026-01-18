export type PaperStatus = 'to-read' | 'in-progress' | 'done' | 'needs-review';

export interface Paper {
  id: string;
  title: string;
  authors: string;
  abstract: string;
  sourceUrl: string;
  canonicalId: string;
  status: PaperStatus;
  type: 'paper' | 'blog';
  publishedAt?: string;
  completedAt?: string;
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

export interface PaperLink {
  id: string;
  sourcePaperId: string;
  targetPaperId: string;
  relation: string;
}

export interface ReadingSession {
  id: string;
  paperId: string;
  startedAt: string;
  endedAt?: string;
  progress: number;
}

export interface DashboardSummary {
  statuses: { status: PaperStatus; count: number }[];
  recentNotes: (Note & { paperTitle: string; paperAuthors: string })[];
}

export interface CreatePaperInput {
  title: string;
  authors?: string;
  abstract?: string;
  sourceUrl: string;
  canonicalId?: string;
  status?: PaperStatus;
  type?: 'paper' | 'blog';
  publishedAt?: string;
  tags?: string[];
}
