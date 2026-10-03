import { z } from 'zod';
import { CategorySchema } from './categories.ts';

export const TaggedWordSchema = z.object({
  word: z.string().min(1),
  category: CategorySchema,
});
export type TaggedWord = z.infer<typeof TaggedWordSchema>;
