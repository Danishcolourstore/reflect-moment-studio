import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { config } from "../src/config.js";
import { storagePaths } from "../src/storage/paths.js";
import { ensureDir } from "../src/utils/fs.js";
import { logger } from "../src/logger.js";

const seedPath = process.argv[2];
const destinationName = process.argv[3] ?? `camera-${Date.now()}.jpg`;

const run = async () => {
  await ensureDir(storagePaths.incoming);

  const destination = path.join(storagePaths.incoming, destinationName);
  let body;
  if (seedPath) {
    body = await fs.readFile(seedPath);
  } else {
    body = await sharp({
      create: {
        width: 2600,
        height: 1700,
        channels: 3,
        background: { r: 34, g: 38, b: 64 },
      },
    })
      .modulate({ brightness: 1.05, saturation: 1.1 })
      .jpeg({ quality: 95 })
      .toBuffer();
  }
  await fs.writeFile(destination, body);

  logger.info(
    {
      destination,
      ftpPort: config.ftp.port,
    },
    "Mock image uploaded to incoming folder",
  );
};

run().catch((error) => {
  logger.error({ err: error }, "Mock upload failed");
  process.exit(1);
});
