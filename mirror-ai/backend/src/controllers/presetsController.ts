import type { Request, Response } from "express";

import { store } from "../services/store.js";

export function getPresetList(_req: Request, res: Response): void {
  res.json({
    items: store.getPresets(),
  });
}
