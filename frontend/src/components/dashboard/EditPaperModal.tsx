import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Modal } from '../ui/modal';
import { Pencil } from 'lucide-react';
import type { Paper } from '../../types';

interface Props {
  paper: Paper;
  onUpdated?: () => void;
}

export function EditPaperModal({ paper, onUpdated }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(paper.title);
  const [authors, setAuthors] = useState(paper.authors);
  const [abstract, setAbstract] = useState(paper.abstract);
  const [tags, setTags] = useState(paper.tags.join(', '));
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      api.updatePaper(paper.id, {
        title: title || paper.title,
        authors,
        abstract,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      }),
    onSuccess: () => {
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['papers'] });
      queryClient.invalidateQueries({ queryKey: ['papers', paper.id] });
      onUpdated?.();
    }
  });

  // Reset form when modal opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setTitle(paper.title);
      setAuthors(paper.authors);
      setAbstract(paper.abstract);
      setTags(paper.tags.join(', '));
    }
    setOpen(isOpen);
  };

  return (
    <Modal
      title="Edit paper"
      description="Update the paper metadata."
      open={open}
      onOpenChange={handleOpenChange}
      trigger={
        <Button variant="ghost" className="px-2">
          <Pencil className="h-4 w-4" />
        </Button>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="text-xs text-white/50 mb-1 block">Source URL (read-only)</label>
          <Input value={paper.sourceUrl} disabled className="opacity-60 cursor-not-allowed" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} required />
          <Input placeholder="Authors" value={authors} onChange={(event) => setAuthors(event.target.value)} />
        </div>
        <Textarea placeholder="Abstract" value={abstract} onChange={(event) => setAbstract(event.target.value)} rows={3} />
        <Input placeholder="Tags (comma separated)" value={tags} onChange={(event) => setTags(event.target.value)} />
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!title || mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
