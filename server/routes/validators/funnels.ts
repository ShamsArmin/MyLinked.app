import { z } from "zod";
import { StepsDSL } from "../../../shared/schema";

export const StepZ = z.object({
  event: z.string().min(1),
  filters: z
    .array(
      z.object({
        field: z.string(),
        op: z.enum(["eq", "neq", "in", "not_in", "contains", "regex", "gte", "lte", "between"]),
        value: z.any(),
      })
    )
    .optional(),
  where: z
    .object({
      pathRegex: z.string().optional(),
      screen: z.string().optional(),
    })
    .optional(),
});

export const StepsDSLZ = z.object({ steps: z.array(StepZ).min(2) });

export const UpsertFunnelZ = z
  .object({
    name: z.string().min(1),
    description: z.string().optional(),
    ownerUserId: z.string().uuid().optional(),
    tags: z.array(z.string()).optional(),
    windowSeconds: z.number().int().positive(),
    scope: z.enum(["user", "session"]),
    dedupe: z.enum(["first_touch", "last_touch", "per_day"]),
    segmentId: z.string().uuid().nullable().optional(),
    experimentKey: z.string().optional(),
    steps: StepsDSLZ.shape.steps,
  })
  .transform((v) => ({
    ...v,
    stepsJSON: { steps: v.steps } as StepsDSL,
  }));
