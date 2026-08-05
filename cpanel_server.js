/**
 * PEKEFE ERP & Web Application — cPanel Node.js Selector Entry Point
 * 
 * Complies with Phusion Passenger dynamic socket / port allocation.
 */

const path = require("path");
const fs = require("fs");

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
