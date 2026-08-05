/**
 * PEKEFE ERP & Web Application — cPanel Node.js Selector Entry Point
 * 
 * cPanel "Setup Node.js App" menüsünde "Application startup file" olarak 
 * bu dosyayı (cpanel_server.js) seçiniz.
 */

const path = require("path");

// Process port & environment
process.env.NODE_ENV = "production";
const PORT = process.env.PORT || 3000;

// Require Next.js standalone server
require(path.join(__dirname, ".next", "standalone", "server.js"));
