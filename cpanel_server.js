const path = require("path");
const fs = require("fs");

const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  try { require("dotenv").config({ path: envPath }); } catch (e) {}
}

process.env.NODE_ENV = "production";

if (!process.env.PORT) {
  process.env.PORT = "3001";
}

const standaloneDir = path.join(__dirname, ".next", "standalone");
if (fs.existsSync(standaloneDir)) {
  // Ensure public and static assets exist inside standalone
  try {
    const srcPublic = path.join(__dirname, "public");
    const destPublic = path.join(standaloneDir, "public");
    if (fs.existsSync(srcPublic) && !fs.existsSync(destPublic)) {
      fs.cpSync(srcPublic, destPublic, { recursive: true });
    }

    const srcStatic = path.join(__dirname, ".next", "static");
    const destStatic = path.join(standaloneDir, ".next", "static");
    if (fs.existsSync(srcStatic) && !fs.existsSync(destStatic)) {
      fs.mkdirSync(path.dirname(destStatic), { recursive: true });
      fs.cpSync(srcStatic, destStatic, { recursive: true });
    }
  } catch (err) {
    console.error("[CPANEL_SERVER] Error syncing static assets:", err);
  }

  process.chdir(standaloneDir);
  require("./server.js");
} else {
  console.error("[CPANEL_SERVER] Standalone build not found. Running fall-back next start.");
  require("next/dist/server/lib/start-server").startServer({
    dir: __dirname,
    port: parseInt(process.env.PORT, 10),
    hostname: "0.0.0.0"
  });
}
