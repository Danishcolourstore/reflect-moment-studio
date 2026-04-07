import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../src/config.js";
import { storagePaths } from "../src/storage/paths.js";
import { ensureDir } from "../src/utils/fs.js";
import { logger } from "../src/logger.js";

const seedPath =
  process.argv[2] ?? path.resolve(process.cwd(), "..", "..", "public", "placeholder.svg");
const destinationName = process.argv[3] ?? `camera-${Date.now()}.png`;

const run = async () => {
  await ensureDir(storagePaths.incoming);

  const destination = path.join(storagePaths.incoming, destinationName);
  const body = await fs.readFile(seedPath);
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
