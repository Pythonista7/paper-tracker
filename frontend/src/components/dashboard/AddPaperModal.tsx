import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Modal } from '../ui/modal';
import { Plus } from 'lucide-react';

interface Props {
  onCreated?: () => void;
}

export function AddPaperModal({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [abstract, setAbstract] = useState('');
  const [tags, setTags] = useState('');
  const [type, setType] = useState<'paper' | 'blog'>('paper');
  const [publishedAt, setPublishedAt] = useState('');
  const [loadingMeta, setLoadingMeta] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      api.createPaper({
        sourceUrl,
        title: title || sourceUrl,
        authors,
        abstract,
        type,
        publishedAt: publishedAt || undefined,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      }),
    onSuccess: () => {
      setSourceUrl('');
      setTitle('');
      setAuthors('');
      setAbstract('');
      setTags('');
      setType('paper');
      setPublishedAt('');
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['papers'] });
      onCreated?.();
    }
  });

  const fetchMetadata = async () => {
    if (!sourceUrl) return;
    setLoadingMeta(true);
    try {
      const metadata = await api.ingest(sourceUrl);
      setTitle(metadata.title ?? '');
      setAuthors(metadata.authors ?? '');
      setAbstract(metadata.abstract ?? '');
      if (metadata.publishedAt) {
        // Ensure format YYYY-MM-DD
        setPublishedAt(metadata.publishedAt.split('T')[0]);
      }
      if (metadata.tags) {
        setTags(metadata.tags.join(', '));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMeta(false);
    }
  };

  return (
    <Modal
      title="Add research paper"
      description="Paste any arXiv/PDF link and optional metadata."
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button variant="primary" className="text-sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Paper
        </Button>
      }
    >
      <Input placeholder="PDF or arXiv URL" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} required />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <Input placeholder="Authors" value={authors} onChange={(event) => setAuthors(event.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          value={type}
          onChange={(e) => setType(e.target.value as 'paper' | 'blog')}
        >
          <option value="paper">Paper</option>
          <option value="blog">Blog / Article</option>
        </select>
        <Input 
          type="date" 
          placeholder="Published Date" 
          value={publishedAt} 
          onChange={(event) => setPublishedAt(event.target.value)} 
        />
      </div>
      <Textarea placeholder="Abstract" value={abstract} onChange={(event) => setAbstract(event.target.value)} rows={3} />
      <Input placeholder="Tags (comma separated)" value={tags} onChange={(event) => setTags(event.target.value)} />
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={fetchMetadata} disabled={!sourceUrl || loadingMeta}>
          {loadingMeta ? 'Prefilling…' : 'Prefill metadata'}
        </Button>
        <Button onClick={() => mutation.mutate()} disabled={!sourceUrl || mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Thank you to arXiv for use of its open access interoperability.
      </p>
    </Modal>
  );
}
