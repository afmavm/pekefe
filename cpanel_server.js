/**
 * PEKEFE ERP & Web Application — cPanel Node.js Selector Entry Point
 * 
 * Binds explicitly to port 3001 to prevent port collisions with atakaricilik.com on port 3000.
 */

const path = require("path");
const fs = require("fs");

const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  try { require("dotenv").config({ path: envPath }); } catch (e) {}
}

process.env.NODE_ENV = "production";
process.env.PORT = "3001";

const standaloneServer = path.join(__dirname, ".next", "standalone", "server.js");
const rootServer = path.join(__dirname, "server.js");

if (fs.existsSync(standaloneServer)) {
  require(standaloneServer);
} else if (fs.existsSync(rootServer)) {
  require(rootServer);
} else {
  console.error("Error: Could not locate Next.js standalone server.js entry point!");
}
