import type { CreatePaperInput, DashboardSummary, Note, Paper, PaperStatus } from './types';

const API_BASE = '/api';

type FetchOptions = RequestInit & { headers?: Record<string, string> };

async function request<T>(path: string, options: FetchOptions = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? 'Request failed');
  }

  return (await response.json()) as T;
}

export const api = {
  getPapers: (params: { search?: string; status?: PaperStatus | 'all'; tag?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('q', params.search);
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.tag) query.set('tag', params.tag);
    const qs = query.toString();
    return request<Paper[]>(`/papers${qs ? `?${qs}` : ''}`);
  },
  getPaper: (id: string) => request<Paper>(`/papers/${id}`),
  createPaper: (payload: CreatePaperInput) => request<Paper>('/papers', { method: 'POST', body: JSON.stringify(payload) }),
  updatePaper: (id: string, payload: Partial<CreatePaperInput>) =>
    request<Paper>(`/papers/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deletePaper: (id: string) => request(`/papers/${id}`, { method: 'DELETE' }),
  getNotes: (paperId: string) => request<Note[]>(`/papers/${paperId}/notes`),
  createNote: (paperId: string, body: { body: string; pageRef?: string; sectionRef?: string }) =>
    request<Note[]>(`/papers/${paperId}/notes`, { method: 'POST', body: JSON.stringify(body) }),
  updateNote: (noteId: string, body: { body: string; pageRef?: string; sectionRef?: string }) =>
    request<Note>(`/notes/${noteId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteNote: (noteId: string) => request(`/notes/${noteId}`, { method: 'DELETE' }),
  getDashboard: () => request<DashboardSummary>('/dashboard'),
  ingest: (sourceUrl: string) => request<Omit<CreatePaperInput, 'sourceUrl'>>('/papers/ingest', { method: 'POST', body: JSON.stringify({ sourceUrl }) })
};
