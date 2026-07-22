import { z } from "zod";

export const ProblemDetailsSchema = z.object({
  type: z.string().url().optional(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string().optional(),
  instance: z.string().optional(),
  correlationId: z.string().optional(),
  errors: z.array(
    z.object({
      code: z.string(),
      message: z.string(),
      path: z.array(z.string()).optional()
    })
  ).optional()
});

export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>;
