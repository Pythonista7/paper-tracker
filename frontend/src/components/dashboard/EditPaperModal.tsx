import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Modal } from '../ui/modal';
import { Pencil, Trash2, Plus } from 'lucide-react';
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
  const [publishedAt, setPublishedAt] = useState(paper.publishedAt ? paper.publishedAt.split('T')[0] : '');
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'links'>('details');
  const [targetPaperId, setTargetPaperId] = useState('');
  const [relation, setRelation] = useState('related-to');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      api.updatePaper(paper.id, {
        title: title || paper.title,
        authors,
        abstract,
        publishedAt: publishedAt || undefined,
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

  const { data: links, refetch: refetchLinks } = useQuery({
    queryKey: ['papers', paper.id, 'links'],
    queryFn: () => api.getLinks(paper.id),
    enabled: open
  });

  const { data: allPapers } = useQuery({
    queryKey: ['papers'],
    queryFn: () => api.getPapers({ status: 'all' }),
    enabled: open && activeTab === 'links'
  });

  const linkMutation = useMutation({
    mutationFn: () => api.createLink({ sourceId: paper.id, targetId: targetPaperId, relation }),
    onSuccess: () => {
      setTargetPaperId('');
      setRelation('related-to');
      refetchLinks();
    }
  });

  const deleteLinkMutation = useMutation({
    mutationFn: (linkId: string) => api.deleteLink(linkId),
    onSuccess: () => refetchLinks()
  });

  // Reset form when modal opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setTitle(paper.title);
      setAuthors(paper.authors);
      setAbstract(paper.abstract);
      setTags(paper.tags.join(', '));
      setPublishedAt(paper.publishedAt ? paper.publishedAt.split('T')[0] : '');
    }
    setOpen(isOpen);
  };

  const refetchPublishedDate = async () => {
    setLoadingMeta(true);
    try {
      const metadata = await api.ingest(paper.sourceUrl, true); // Bust cache when refetching
      if (metadata.publishedAt) {
        setPublishedAt(metadata.publishedAt.split('T')[0]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMeta(false);
    }
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
      <div className="flex border-b border-white/5 mb-4">
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'details' ? 'text-primary border-b-2 border-primary' : 'text-white/60 hover:text-white'}`}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'links' ? 'text-primary border-b-2 border-primary' : 'text-white/60 hover:text-white'}`}
          onClick={() => setActiveTab('links')}
        >
          Connections
        </button>
      </div>

      {activeTab === 'details' ? (
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
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input
              type="date"
              placeholder="Published Date"
              value={publishedAt}
              onChange={(event) => setPublishedAt(event.target.value)}
            />
            <Button
              variant="ghost"
              type="button"
              onClick={refetchPublishedDate}
              disabled={loadingMeta}
            >
              {loadingMeta ? 'Fetching…' : 'Refetch date'}
            </Button>
          </div>
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
      ) : (
        <div className="space-y-4">
          <div className="bg-surface-800 rounded-md p-3 space-y-3">
            <h4 className="text-sm font-medium">Add New Connection</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={targetPaperId}
                onChange={(e) => setTargetPaperId(e.target.value)}
              >
                <option value="" disabled>Select paper...</option>
                {allPapers?.filter(p => p.id !== paper.id).map(p => (
                  <option key={p.id} value={p.id} className="text-black">{p.title}</option>
                ))}
              </select>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
              >
                <option value="related-to" className="text-black">Related To</option>
                <option value="prerequisite-for" className="text-black">Prerequisite For</option>
                <option value="extends" className="text-black">Extends</option>
                <option value="critiques" className="text-black">Critiques</option>
              </select>
            </div>
            <Button size="sm" onClick={() => linkMutation.mutate()} disabled={!targetPaperId || linkMutation.isPending}>
              <Plus className="w-4 h-4 mr-2" /> Add Connection
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Existing Connections</h4>
            {(!links?.outgoing.length && !links?.incoming.length) && (
              <p className="text-xs text-muted-foreground italic">No connections yet.</p>
            )}

            {links?.outgoing.map((link: any) => (
              <div key={link.id} className="flex items-center justify-between p-2 rounded bg-surface-800 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-white/70"> This </span>
                  <span className="text-xs font-mono bg-primary/20 text-primary px-1 rounded">{link.relation}</span>
                  <span className="font-medium truncate max-w-[150px]">{link.targetTitle}</span>
                </div>
                <button onClick={() => deleteLinkMutation.mutate(link.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {links?.incoming.map((link: any) => (
              <div key={link.id} className="flex items-center justify-between p-2 rounded bg-surface-800 text-sm opacity-80">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate max-w-[150px]">{link.sourceTitle}</span>
                  <span className="text-xs font-mono bg-primary/20 text-primary px-1 rounded">{link.relation}</span>
                  <span className="text-white/70"> This </span>
                </div>
                <button onClick={() => deleteLinkMutation.mutate(link.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
