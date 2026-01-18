import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { api } from '../../api';
import type { DashboardSummary as Summary } from '../../types';
import { Card } from '../ui/card';

const LABELS: Record<string, string> = {
  'to-read': 'To Read',
  'in-progress': 'In Progress',
  'needs-review': 'Needs Review',
  done: 'Done'
};

export function DashboardSummary() {
  const { data } = useQuery<Summary>({ queryKey: ['dashboard'], queryFn: api.getDashboard });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {(data?.statuses ?? []).map((item) => (
        <Card key={item.status} className="space-y-2 p-4">
          <p className="text-sm uppercase tracking-wide text-white/60">{LABELS[item.status] ?? item.status}</p>
          <p className="text-3xl font-semibold">{item.count}</p>
        </Card>
      ))}
      <Card className="sm:col-span-2 p-4">
        <p className="text-sm uppercase tracking-wide text-white/60">Recent notes</p>
        <div className="mt-2 space-y-2 text-sm text-white/70">
          {(data?.recentNotes ?? []).map((note) => (
            <div key={note.id} className="rounded-xl bg-white/5 p-3">
              <div className="flex justify-between items-start mb-3 gap-4 bg-gradient-to-r from-white/5 to-white/0 p-2 rounded-lg">
                <div>
                  <p className="font-semibold text-white text-base leading-snug">{note.paperTitle}</p>
                  <p className="text-sm text-white/60 mt-0.5">{note.paperAuthors}</p>
                </div>
                <p className="text-xs text-white/40 whitespace-nowrap shrink-0 mt-1">{new Date(note.updatedAt).toLocaleString()}</p>
              </div>
              
              <div className="notes-editor__content !min-h-0 !bg-transparent !p-0 [&_p]:mb-0 line-clamp-2">
                <ReactMarkdown>{note.body}</ReactMarkdown>
              </div>
            </div>
          ))}
          {!data?.recentNotes?.length && <p>No notes yet.</p>}
        </div>
      </Card>
    </div>
  );
}
