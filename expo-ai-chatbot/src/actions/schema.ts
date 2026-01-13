import { z } from 'zod/v4';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
