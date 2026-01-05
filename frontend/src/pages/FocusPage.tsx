import { useQuery } from '@tanstack/react-query';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import type { Paper } from '../types';
import { Button } from '../components/ui/button';
import { PdfViewer } from '../components/reader/PdfViewer';
import { NotesPanel } from '../components/reader/NotesPanel';
import { SplitPanel } from '../components/ui/split-panel';

export function FocusPage() {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const paperQuery = useQuery({ queryKey: ['paper', paperId], queryFn: () => api.getPaper(paperId!), enabled: Boolean(paperId) });


  if (!paperId) {
    return <Navigate to="/dashboard" replace />;
  }

  if (paperQuery.isError) {
    return <Navigate to="/dashboard" replace />;
  }

  if (paperQuery.isLoading || !paperQuery.data) {
    return <p>Loading…</p>;
  }

  const paper: Paper = paperQuery.data;

  return (
    <div className="relative min-h-screen bg-black text-white">
      <div className="h-screen w-screen">
        <Button
        variant="danger"
        onClick={() => navigate(`/read/${paper.id}`)}
        className="absolute right-6 bottom-4 z-10 bg-orange/60"
      >
        ← Back
      </Button>
        <div className="h-full rounded-3xl border border-white/10 bg-surface-900/80 p-4">
          <SplitPanel
            id={paper.id}
            initial={60}
            left={<PdfViewer url={paper.sourceUrl} title={paper.title} />}
            right={<NotesPanel paperId={paper.id} sourceUrl={paper.sourceUrl} />}
          />
        </div>
      </div>
    </div>
  );
}
