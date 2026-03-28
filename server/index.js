import { startMirrorAiServer } from "./server.js";

startMirrorAiServer().catch((error) => {
  console.error("Failed to start Mirror AI server", error);
  process.exit(1);
});
