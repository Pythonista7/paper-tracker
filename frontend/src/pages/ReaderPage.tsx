import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeftCircle, ChevronDown, ExternalLink, PenLine } from 'lucide-react';
import { api } from '../api';
import type { Paper, PaperStatus } from '../types';
import { STATUSES } from '../constants';
import { Button } from '../components/ui/button';
import { NotesPreview } from '../components/reader/NotesPreview';

export function ReaderPage() {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const paperQuery = useQuery({
    queryKey: ['paper', paperId],
    queryFn: () => api.getPaper(paperId!),
    enabled: Boolean(paperId)
  });

  const mutation = useMutation({
    mutationFn: (status: PaperStatus) => api.updatePaper(paperId!, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['papers'] });
      queryClient.invalidateQueries({ queryKey: ['paper', paperId] });
    }
  });

  if (!paperId) {
    return (
      <div className="flex h-full items-center justify-center p-10 text-center text-white/60">
        <div className="max-w-md rounded-2xl border border-white/5 bg-surface-800/60 p-8">
          <p className="mb-4">Select a paper from the dashboard to start reading.</p>
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (paperQuery.isError) {
    return <Navigate to="/dashboard" replace />;
  }

  if (paperQuery.isLoading || !paperQuery.data) {
    return (
      <div className="flex h-screen items-center justify-center text-white/50">
        <p>Loading paper…</p>
      </div>
    );
  }

  const paper: Paper = paperQuery.data;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface-950 text-white">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between bg-surface-900 px-4">
        <div className="flex items-center gap-4 overflow-hidden">
          <Button 
            variant="ghost"
            className="h-max w-max" 
            onClick={() => navigate('/dashboard')}
            title="Back to Dashboard"
          >
            <ChevronLeftCircle className="h-9 w-9" />
          </Button>
          <div className="flex flex-col overflow-hidden">
            <h1 className="truncate text-lg font-medium leading-tight">{paper.title}</h1>
            <p className="truncate text-xs text-white/50">{paper.authors || 'Unknown authors'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={paper.status}
              onChange={(e) => mutation.mutate(e.target.value as PaperStatus)}
              className="appearance-none rounded-lg border border-white/10 bg-surface-800 py-1.5 pl-3 pr-9 text-sm text-white transition-colors hover:border-white/20 focus:border-accent focus:outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>

          <div className="h-6 w-px bg-white/10" />

          <Button 
            variant="ghost" 
            className="h-9 px-3 text-xs" 
            onClick={() => window.open(paper.sourceUrl, '_blank')}
          >
            <ExternalLink className="mr-2 h-3.5 w-3.5" />
            Source
          </Button>
          
          <Button 
            variant="primary" 
            className="h-9 px-3 text-xs" 
            onClick={() => navigate(`/focus/${paper.id}`)}
          >
            <PenLine className="mr-2 h-3.5 w-3.5" />
            Focus
          </Button>
        </div>
      </header>


      {/* Main Content */}
      <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
        {paper.abstract && (
          <div className="shrink-0 rounded-2xl border border-white/5 bg-surface-900 shadow-lg">
            <div className="border-b border-white/5 p-4">
              <h2 className="font-semibold">Abstract</h2>
            </div>
            <div className="max-h-60 overflow-y-auto p-4 text-sm leading-relaxed text-white/80">
              {paper.abstract}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden rounded-2xl border border-white/5 bg-surface-900 shadow-2xl">
          <div className="flex h-full flex-col overflow-hidden">
            <div className="border-b border-white/5 p-4">
              <h2 className="font-semibold">Notes</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <NotesPreview paperId={paper.id} />
            </div>
          </div>
        </div>
      </div>
      </div>
  );
}