/**
 * PEKEFE ERP & Web Application — cPanel Node.js Selector Entry Point
 * 
 * Dynamically switches working directory to .next/standalone to resolve Next.js BUILD_ID
 * and standalone server asset manifests.
 */

const path = require("path");
const fs = require("fs");

const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  try { require("dotenv").config({ path: envPath }); } catch (e) {}
}

process.env.NODE_ENV = "production";
process.env.PORT = "3001";

const standaloneDir = path.join(__dirname, ".next", "standalone");

if (fs.existsSync(standaloneDir)) {
  process.chdir(standaloneDir);
  require(path.join(standaloneDir, "server.js"));
} else if (fs.existsSync(path.join(__dirname, "server.js"))) {
  require(path.join(__dirname, "server.js"));
} else {
  console.error("Error: Could not locate Next.js standalone server.js entry point!");
}
