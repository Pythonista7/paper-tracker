import type { PaperStatus } from '../../types';
import { cn } from '../../lib/cn';

const statusColors: Record<PaperStatus, string> = {
  'to-read': 'bg-blue-500/20 text-blue-200 border-blue-400/30',
  'in-progress': 'bg-amber-500/20 text-amber-100 border-amber-400/30',
  'needs-review': 'bg-purple-500/20 text-purple-100 border-purple-400/30',
  done: 'bg-emerald-500/20 text-emerald-100 border-emerald-400/30'
};

const statusLabels: Record<PaperStatus, string> = {
  'to-read': 'To Read',
  'in-progress': 'In Progress',
  'needs-review': 'Needs Review',
  done: 'Done'
};

interface StatusBadgeProps {
  status: PaperStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', statusColors[status])}>{statusLabels[status]}</span>;
}
