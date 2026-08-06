/**
 * PEKEFE ERP & Web Application — cPanel Node.js Selector Entry Point
 * 
 * Preserves Phusion Passenger's dynamic socket/port in process.env.PORT
 * so Passenger can proxy requests without 503 socket timeout errors.
 */

const path = require("path");
const fs = require("fs");

const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  try { require("dotenv").config({ path: envPath }); } catch (e) {}
}

process.env.NODE_ENV = "production";

// Preserve Phusion Passenger socket provided in process.env.PORT
if (!process.env.PORT) {
  process.env.PORT = "3000";
}

const standaloneDir = path.join(__dirname, ".next", "standalone");
if (fs.existsSync(standaloneDir)) {
  process.chdir(standaloneDir);
}

require("./server.js");
