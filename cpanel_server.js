/**
 * PEKEFE ERP & Web Application — cPanel Node.js Selector Entry Point
 */

const path = require("path");
const fs = require("fs");

// Load .env explicitly before server initialization
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  require("dotenv").config({ path: envPath });
}

process.env.NODE_ENV = "production";

const standaloneServer = path.join(__dirname, ".next", "standalone", "server.js");
const rootServer = path.join(__dirname, "server.js");

if (fs.existsSync(standaloneServer)) {
  require(standaloneServer);
} else if (fs.existsSync(rootServer)) {
  require(rootServer);
} else {
  console.error("Error: Could not locate Next.js standalone server.js entry point!");
}
