import type { ShootCategory } from "../types.js";

export interface QueueTask {
  imageId: string;
  presetId?: string;
  retouchIntensity?: number;
  category?: ShootCategory;
  batchId?: string;
}

export interface QueueDriver {
  kind: "redis" | "memory";
  enqueue(task: QueueTask): Promise<void>;
  start(onTask: (task: QueueTask) => Promise<void>): Promise<void>;
  close(): Promise<void>;
}
