import { io, type Socket } from "socket.io-client";
import type { Category, Controls, MirrorImage, Preset } from "./types";
import { api } from "./api";

export type BootstrapPayload = {
  images: MirrorImage[];
  controls: Controls;
  presets: Preset[];
};

export type MirrorSocketEvents = {
  bootstrap: (payload: BootstrapPayload) => void;
  "image:ingested": (payload: { image: MirrorImage }) => void;
  "image:processing": (payload: { image: MirrorImage }) => void;
  "image:processed": (payload: { image: MirrorImage }) => void;
  "controls:updated": (payload: { controls: Controls }) => void;
  "preset:updated": (payload: { preset: Preset }) => void;
  "categories:updated": (payload: { categories: Category[] }) => void;
};

export const createMirrorSocket = (): Socket<MirrorSocketEvents> =>
  io(api.baseUrl, {
    transports: ["websocket"],
    withCredentials: true,
  });
