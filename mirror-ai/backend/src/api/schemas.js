import { z } from "zod";

const numericRange = (min, max) => z.number().min(min).max(max);

export const controlsUpdateSchema = z
  .object({
    activePresetId: z.string().min(1).optional(),
    retouchIntensity: numericRange(0, 1).optional(),
  })
  .strict()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one control key must be provided",
  });

export const presetUpdateSchema = z
  .object({
    label: z.string().min(1).max(60).optional(),
    exposure: numericRange(-1, 1).optional(),
    warmth: numericRange(-1, 1).optional(),
    saturation: numericRange(0.7, 1.4).optional(),
    contrast: numericRange(0.7, 1.5).optional(),
    skinSoftening: numericRange(0, 1).optional(),
    shadowsLift: numericRange(-0.2, 0.6).optional(),
    grain: numericRange(0, 0.2).optional(),
  })
  .strict()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one preset key must be provided",
  });

export const batchApplySchema = z.object({
  imageIds: z.array(z.string().min(1)).min(1),
  presetId: z.string().min(1).optional(),
  retouchIntensity: numericRange(0, 1).optional(),
});
