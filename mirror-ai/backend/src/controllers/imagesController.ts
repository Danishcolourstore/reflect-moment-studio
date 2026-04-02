import { type Request, type Response } from "express";
import path from "node:path";
import multer from "multer";
import { env } from "../config/env.js";
import { paths } from "../config/paths.js";
import { ingestIncomingFile } from "../services/ingest.js";
import { toPublicImage } from "../services/serializers.js";
import { store } from "../services/store.js";

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, paths.ftpInbox),
    filename: (_req, file, cb) => cb(null, `${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`),
  }),
  limits: {
    fileSize: env.MAX_UPLOAD_MB * 1024 * 1024,
  },
});

export const uploadMiddleware = upload.single("image");

export function listImages(_req: Request, res: Response): void {
  const items = store.listImages().map(toPublicImage);
  res.json({ items });
}

export async function uploadImage(req: Request, res: Response): Promise<void> {
  const file = req.file;
  if (!file || Array.isArray(file)) {
    res.status(400).json({ error: "No image file provided" });
    return;
  }

  const image = await ingestIncomingFile(path.join(paths.ftpInbox, file.filename), "api");
  res.status(201).json({ image: toPublicImage(image) });
}
