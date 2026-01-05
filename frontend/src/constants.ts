import type { PaperStatus } from './types';

export const STATUSES: { value: PaperStatus; label: string }[] = [
  { value: 'to-read', label: 'To Read' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'needs-review', label: 'Needs Review' },
  { value: 'done', label: 'Done' }
];
