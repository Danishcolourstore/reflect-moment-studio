import path from "node:path";
import { dirs } from "../config/env.js";

export const toPosixPath = (value: string): string => value.split(path.sep).join("/");

export const toPublicMediaPath = (absolutePath: string): string => {
  const relative = path.relative(dirs.root, absolutePath);
  const normalized = toPosixPath(relative);
  return `/media/${normalized}`;
};

export const extOrDefault = (fileName: string, fallback = ".jpg"): string => {
  const ext = path.extname(fileName).toLowerCase();
  return ext || fallback;
};
