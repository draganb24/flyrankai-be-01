import { z } from 'zod';

export const CATEGORIES = [
  'fiction',
  'nonfiction',
  'science',
  'history',
  'business',
  'children',
  'fantasy',
  'other',
];

export const QUALITY_FLAGS = [
  'missing_author',
  'price_unparseable',
  'low_confidence',
  'likely_duplicate',
  'none',
];

export const enrichInputSchema = z.object({
  title: z.string().trim().min(1, 'title is required').max(300, 'title too long (max 300)'),
  author: z.string().max(200, 'author too long (max 200)'),
  price: z.string().max(200, 'price too long (max 200)'),
  description: z.string().max(5000, 'description too long (max 5000)').optional(),
});

export const enrichOutputSchema = z.object({
  category: z.enum(CATEGORIES),
  summary: z.string().min(1).max(160),
  quality_flags: z.array(z.enum(QUALITY_FLAGS)).min(1),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1).max(200),
});
