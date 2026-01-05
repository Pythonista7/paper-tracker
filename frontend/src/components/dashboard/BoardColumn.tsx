import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import type { Paper, PaperStatus } from '../../types';
import { api } from '../../api';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { StatusBadge } from '../ui/status-badge';

interface ColumnProps {
  title: string;
  papers: Paper[];
  onOpen: (paper: Paper) => void;
}

export function BoardColumn({ title, papers, onOpen }: ColumnProps) {
  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-white/50">{title}</p>
          <p className="text-3xl font-semibold">{papers.length}</p>
        </div>
      </header>
      <div className="space-y-3">
        {papers.map((paper) => (
          <PaperCard key={paper.id} paper={paper} onOpen={() => onOpen(paper)} />
        ))}
        {!papers.length && <p className="text-sm text-white/40">Nothing here yet.</p>}
      </div>
    </section>
  );
}

function PaperCard({ paper, onOpen }: { paper: Paper; onOpen: () => void }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (status: PaperStatus) => api.updatePaper(paper.id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['papers'] })
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deletePaper(paper.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['papers'] })
  });

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">{paper.title}</h3>
          <p className="text-sm text-white/60">{paper.authors || 'Unknown authors'}</p>
        </div>
        <StatusBadge status={paper.status} />
      </div>
      {paper.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs text-white/70">
          {paper.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-white/10 px-2 py-0.5">
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="flex-1 rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white"
          value={paper.status}
          onChange={(event) => mutation.mutate(event.target.value as PaperStatus)}
        >
          <option value="to-read">To Read</option>
          <option value="in-progress">In Progress</option>
          <option value="needs-review">Needs Review</option>
          <option value="done">Done</option>
        </select>
        <div className='flex justify-around gap-2'>
          <Button variant="primary" onClick={onOpen}>
            Open
          </Button>
          <Button
            variant="danger"
            className="px-2 text-red-400 hover:bg-red-400/10 hover:text-red-300"
            onClick={() => {
              if (confirm('Are you sure you want to delete this paper?')) {
                deleteMutation.mutate();
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
