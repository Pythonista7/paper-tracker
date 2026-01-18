import type { CreatePaperInput, DashboardSummary, Note, Paper, PaperStatus } from './types';

const API_BASE = '/api';

type FetchOptions = RequestInit & { headers?: Record<string, string> };

async function request<T>(path: string, options: FetchOptions = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include', // Important: include cookies for auth
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    const error = new Error(payload.error ?? 'Request failed') as Error & { status?: number };
    error.status = response.status;
    throw error;
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
  ingest: (sourceUrl: string, bustCache = false) => {
    const query = bustCache ? '?bustCache=true' : '';
    return request<Omit<CreatePaperInput, 'sourceUrl'>>(`/papers/ingest${query}`, { method: 'POST', body: JSON.stringify({ sourceUrl }) });
  },
  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(`${API_BASE}/images/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error ?? 'Failed to upload image');
    }

    return await response.json() as { url: string };
  },
  getPublicFeed: () => request<Paper[]>('/public/feed'),
  getPublicPaperDetails: (id: string) => request<{ paper: Paper; notes: Note[]; links: { outgoing: any[]; incoming: any[] } }>(`/public/papers/${id}`),
  getLinks: (paperId: string) => request<{ outgoing: any[]; incoming: any[] }>(`/papers/${paperId}/links`),
  createLink: (payload: { sourceId: string; targetId: string; relation: string }) => request('/links', { method: 'POST', body: JSON.stringify(payload) }),
  deleteLink: (id: string) => request(`/links/${id}`, { method: 'DELETE' }),
  getPublicGraph: () => request<{ nodes: any[]; links: any[] }>('/public/graph'),
};

// Auth API
export async function login(email: string, password: string) {
  return request<{ success: boolean; email: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export async function logout() {
  return request<{ success: boolean }>('/auth/logout', {
    method: 'POST'
  });
}

export async function checkAuth() {
  return request<{ authenticated: boolean; email?: string }>('/auth/check');
}
