import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { api } from '../../api';

interface Props {
  paperId: string;
}

export function NotesPreview({ paperId }: Props) {
  const { data, isLoading } = useQuery({ queryKey: ['notes', paperId], queryFn: () => api.getNotes(paperId), enabled: Boolean(paperId) });
  const note = data?.[0];

  if (!paperId) {
    return <p className="text-sm text-white/60">Pick a paper to view notes.</p>;
  }

  if (isLoading) {
    return <p className="text-sm text-white/60">Loading notes…</p>;
  }

  if (!note) {
    return <p className="text-sm text-white/60">No notes yet. Hit “Start Noting” to write your first thoughts.</p>;
  }

  return (
    <div>
      <div className="notes-editor">
        <div className="notes-editor__content">
          <ReactMarkdown>{note.body}</ReactMarkdown>
        </div>
      </div>
      <p className="mt-4 text-xs text-white/50">Last updated {new Date(note.updatedAt).toLocaleString()}</p>
    </div>
  );
}
