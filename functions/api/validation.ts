import { z } from 'zod';

export const paperInputSchema = z.object({
  title: z.string().min(1).max(512),
  authors: z.string().optional().default(''),
  abstract: z.string().optional().default(''),
  sourceUrl: z.string().url(),
  canonicalId: z.string().optional().default(''),
  status: z.enum(['to-read', 'in-progress', 'done', 'needs-review']).optional(),
  tags: z.array(z.string()).optional().default([])
});

export const paperUpdateSchema = paperInputSchema.partial();

export const noteInputSchema = z.object({
  body: z.string().min(1),
  pageRef: z.string().optional(),
  sectionRef: z.string().optional()
});

export const sessionInputSchema = z.object({
  paperId: z.string().min(1),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  progress: z.number().min(0).max(1).optional()
});

export const tagInputSchema = z.object({
  label: z.string().min(1).max(64)
});

export type PaperInput = z.infer<typeof paperInputSchema>;
export type PaperUpdateInput = z.infer<typeof paperUpdateSchema>;
export type NoteInput = z.infer<typeof noteInputSchema>;
export type SessionInput = z.infer<typeof sessionInputSchema>;
export type TagInput = z.infer<typeof tagInputSchema>;
