const path = require("path");
const fs = require("fs");

const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  try { require("dotenv").config({ path: envPath }); } catch (e) {}
}

process.env.NODE_ENV = "production";
process.env.HOSTNAME = "0.0.0.0";

// Respect Passenger's PORT/socket if provided, otherwise default to 4000
if (!process.env.PORT || process.env.PORT === "3000") {
  process.env.PORT = "4000";
}

const standaloneDir = path.join(__dirname, ".next", "standalone");
if (fs.existsSync(standaloneDir)) {
  try {
    const srcPublic = path.join(__dirname, "public");
    const destPublic = path.join(standaloneDir, "public");
    if (fs.existsSync(srcPublic)) {
      fs.cpSync(srcPublic, destPublic, { recursive: true, force: true });
    }

    const srcStatic = path.join(__dirname, ".next", "static");
    const destStatic = path.join(standaloneDir, ".next", "static");
    if (fs.existsSync(srcStatic)) {
      fs.mkdirSync(path.dirname(destStatic), { recursive: true });
      fs.cpSync(srcStatic, destStatic, { recursive: true, force: true });
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
    port: parseInt(process.env.PORT, 10) || 4000,
    hostname: "0.0.0.0"
  });
}
