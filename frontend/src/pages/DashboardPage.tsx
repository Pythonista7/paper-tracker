import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import type { Paper, PaperStatus } from '../types';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { BoardColumn } from '../components/dashboard/BoardColumn';
// import { DashboardSummary } from '../components/dashboard/DashboardSummary';
import { AddPaperModal } from '../components/dashboard/AddPaperModal';
import { useAuth } from '../contexts/AuthContext';

const STATUS_COLUMNS: { key: PaperStatus; title: string }[] = [
  { key: 'to-read', title: 'To read' },
  { key: 'in-progress', title: 'In progress' },
  { key: 'needs-review', title: 'Needs review' },
  { key: 'done', title: 'Done' }
];

export function DashboardPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'paper' | 'blog'>('all');
  const papersQuery = useQuery({ queryKey: ['papers'], queryFn: () => api.getPapers() });
  const { isAuthenticated } = useAuth();

  const filtered = useMemo(() => {
    let list = papersQuery.data ?? [];
    
    if (typeFilter !== 'all') {
        list = list.filter(p => p.type === typeFilter);
    }

    if (!search.trim()) return list;
    const term = search.toLowerCase();
    return list.filter((paper) => 
        paper.title.toLowerCase().includes(term) || 
        paper.authors.toLowerCase().includes(term) ||
        paper.tags.some(tag => tag.toLowerCase().includes(term))
    );
  }, [papersQuery.data, search, typeFilter]);

  const grouped = useMemo(() => {
    return STATUS_COLUMNS.reduce<Record<PaperStatus, Paper[]>>(
      (acc, column) => {
        acc[column.key] = filtered.filter((paper) => paper.status === column.key);
        return acc;
      },
      {
        'to-read': [],
        'in-progress': [],
        'needs-review': [],
        done: []
      }
    );
  }, [filtered]);

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-semibold">Dashboard</h2>
          <p className="text-sm uppercase tracking-wide text-white/50">for all that ashwinms.com is reading</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-muted rounded-md p-1 gap-1">
              <Button 
                variant={typeFilter === 'all' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setTypeFilter('all')}
                className="h-8 text-xs px-2"
              >
                All
              </Button>
              <Button 
                variant={typeFilter === 'paper' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setTypeFilter('paper')}
                className="h-8 text-xs px-2"
              >
                Papers
              </Button>
              <Button 
                variant={typeFilter === 'blog' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setTypeFilter('blog')}
                className="h-8 text-xs px-2"
              >
                Blogs
              </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
            <Input
              placeholder="Search by title or author"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-64 pl-9 text-black"
            />
          </div>
          {isAuthenticated && <AddPaperModal />}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-4">
        {STATUS_COLUMNS.map((column) => (
          <BoardColumn key={column.key} title={column.title} papers={grouped[column.key]} onOpen={(paper) => navigate(`/read/${paper.id}`)} />
        ))}
      </section>

      {/* <section>
        <h3 className="mb-4 text-xl font-semibold">Pulse</h3>
        <DashboardSummary />
      </section> */}
    </div>
  );
}
