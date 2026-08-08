const path = require("path");
const fs = require("fs");

// Load environment variables
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  try { require("dotenv").config({ path: envPath }); } catch (e) {}
}

process.env.NODE_ENV = "production";
process.env.HOSTNAME = "0.0.0.0";

// Respect Passenger's PORT if provided, fallback to 4000
if (!process.env.PORT || process.env.PORT === "3000") {
  process.env.PORT = "4000";
}

// Sync public and static files to root .next if needed
try {
  const srcStatic = path.join(__dirname, ".next", "static");
  const destStaticInStandalone = path.join(__dirname, ".next", "standalone", ".next", "static");
  if (fs.existsSync(srcStatic) && !fs.existsSync(destStaticInStandalone)) {
    fs.mkdirSync(path.dirname(destStaticInStandalone), { recursive: true });
    fs.cpSync(srcStatic, destStaticInStandalone, { recursive: true, force: true });
  }

  const srcPublic = path.join(__dirname, "public");
  const destPublicInStandalone = path.join(__dirname, ".next", "standalone", "public");
  if (fs.existsSync(srcPublic) && !fs.existsSync(destPublicInStandalone)) {
    fs.cpSync(srcPublic, destPublicInStandalone, { recursive: true, force: true });
  }
} catch (e) {}

const standaloneServer = path.join(__dirname, ".next", "standalone", "server.js");

if (fs.existsSync(standaloneServer)) {
  console.log("[CPANEL_SERVER] Requiring Next.js standalone server...");
  require(standaloneServer);
} else {
  console.error("[CPANEL_SERVER] Standalone server.js not found at:", standaloneServer);
  require("next/dist/server/lib/start-server").startServer({
    dir: __dirname,
    port: parseInt(process.env.PORT, 10) || 4000,
    hostname: "0.0.0.0"
  });
}
