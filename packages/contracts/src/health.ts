import { z } from 'zod';

export const HealthStatusSchema = z.object({
  status: z.enum(['up', 'down', 'degraded']),
  timestamp: z.string().datetime(),
  version: z.string().optional(),
});

export type HealthStatus = z.infer<typeof HealthStatusSchema>;

export const ReadinessStatusSchema = HealthStatusSchema.extend({
  services: z.record(
    z.string(),
    z.object({
      status: z.enum(['up', 'down']),
      message: z.string().optional(),
    })
  ),
});

export type ReadinessStatus = z.infer<typeof ReadinessStatusSchema>;
