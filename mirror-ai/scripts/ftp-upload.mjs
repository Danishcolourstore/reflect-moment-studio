import fs from "node:fs/promises";
import path from "node:path";
import ftp from "basic-ftp";

const localPath = process.argv[2];
if (!localPath) {
  console.error("Usage: node scripts/ftp-upload.mjs <local-image-path> [remote-name]");
  process.exit(1);
}

const remoteName = process.argv[3] ?? path.basename(localPath);

const FTP_HOST = process.env.FTP_HOST ?? "127.0.0.1";
const FTP_PORT = Number(process.env.FTP_PORT ?? "2121");
const FTP_USER = process.env.FTP_USER ?? "mirror";
const FTP_PASSWORD = process.env.FTP_PASSWORD ?? "mirror";

const run = async () => {
  await fs.access(localPath);

  const client = new ftp.Client(8000);
  client.ftp.verbose = false;

  try {
    await client.access({
      host: FTP_HOST,
      port: FTP_PORT,
      user: FTP_USER,
      password: FTP_PASSWORD,
      secure: false,
    });
    await client.uploadFrom(localPath, remoteName);
    console.log(`Uploaded ${localPath} -> ftp://${FTP_HOST}:${FTP_PORT}/${remoteName}`);
  } finally {
    client.close();
  }
};

run().catch((error) => {
  console.error("FTP upload failed:", error.message);
  process.exit(1);
});
