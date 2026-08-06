const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const desktopZipPath = "C:\\Users\\ETicaret\\Desktop\\pekefe_live_production.zip";
const localZipPath = path.join(rootDir, 'pekefe_live_production.zip');

console.log("[PACK] Starting ultra-complete production ZIP packaging...");

// 1. Ensure postbuild ran
require('./postbuild.js');

// 2. Remove old ZIP files if present
[desktopZipPath, localZipPath].forEach(zipFile => {
  if (fs.existsSync(zipFile)) {
    try { fs.unlinkSync(zipFile); } catch (e) {}
  }
});

// 3. Compress using PowerShell Compress-Archive
console.log("[PACK] Compressing build into ZIP archive...");
const psCommand = `powershell -Command "Compress-Archive -Path '${path.join(rootDir, '.next')}', '${path.join(rootDir, 'public')}', '${path.join(rootDir, 'prisma')}', '${path.join(rootDir, 'cpanel_server.js')}', '${path.join(rootDir, '.htaccess')}', '${path.join(rootDir, '.env')}', '${path.join(rootDir, 'package.json')}' -DestinationPath '${localZipPath}' -Force"`;

try {
  execSync(psCommand, { stdio: 'inherit' });
  console.log(`[PACK] Success! Created ${localZipPath}`);

  // Copy to Desktop
  fs.copyFileSync(localZipPath, desktopZipPath);
  console.log(`[PACK] Success! Copied to ${desktopZipPath}`);
} catch (err) {
  console.error("[PACK] Error creating ZIP archive:", err);
  process.exit(1);
}
