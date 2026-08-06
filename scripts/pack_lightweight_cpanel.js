const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const standaloneDir = path.join(rootDir, '.next', 'standalone');
const tempPackageDir = path.join(rootDir, 'cpanel_deploy_temp');
const localZipPath = path.join(rootDir, 'pekefe_cpanel_standalone.zip');
const desktopZipPath = "C:\\Users\\ETicaret\\Desktop\\pekefe_cpanel_standalone.zip";

console.log("[LIGHT_PACK] Creating lightweight (~40MB) production ZIP for cPanel...");

// 1. Ensure postbuild ran
require('./postbuild.js');

// 2. Clean temp staging directory
if (fs.existsSync(tempPackageDir)) {
  fs.rmSync(tempPackageDir, { recursive: true, force: true });
}
fs.mkdirSync(tempPackageDir, { recursive: true });

// 3. Copy standalone contents to staging
if (fs.existsSync(standaloneDir)) {
  fs.cpSync(standaloneDir, tempPackageDir, { recursive: true, force: true });
}

// 4. Copy public/ to temp/public
const srcPublic = path.join(rootDir, 'public');
const destPublic = path.join(tempPackageDir, 'public');
if (fs.existsSync(srcPublic)) {
  fs.cpSync(srcPublic, destPublic, { recursive: true, force: true });
}

// 5. Copy .next/static to temp/.next/static
const srcStatic = path.join(rootDir, '.next', 'static');
const destStatic = path.join(tempPackageDir, '.next', 'static');
if (fs.existsSync(srcStatic)) {
  fs.mkdirSync(path.dirname(destStatic), { recursive: true });
  fs.cpSync(srcStatic, destStatic, { recursive: true, force: true });
}

// 6. Copy cpanel_server.js, .htaccess, .env, prisma
['cpanel_server.js', '.htaccess', '.env'].forEach(file => {
  const src = path.join(rootDir, file);
  const dest = path.join(tempPackageDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
});

const srcPrisma = path.join(rootDir, 'prisma');
const destPrisma = path.join(tempPackageDir, 'prisma');
if (fs.existsSync(srcPrisma)) {
  fs.cpSync(srcPrisma, destPrisma, { recursive: true, force: true });
}

// 7. Compress temp folder using PowerShell
[localZipPath, desktopZipPath].forEach(f => {
  if (fs.existsSync(f)) try { fs.unlinkSync(f); } catch (e) {}
});

console.log("[LIGHT_PACK] Compressing staging folder...");
const psCommand = `powershell -Command "Compress-Archive -Path '${tempPackageDir}\\*' -DestinationPath '${localZipPath}' -Force"`;

try {
  execSync(psCommand, { stdio: 'inherit' });
  fs.copyFileSync(localZipPath, desktopZipPath);
  console.log(`[LIGHT_PACK] SUCCESS! Lightweight zip created at ${desktopZipPath}`);
} catch (err) {
  console.error("[LIGHT_PACK] Error creating zip:", err);
} finally {
  // Clean temp folder
  try { fs.rmSync(tempPackageDir, { recursive: true, force: true }); } catch (e) {}
}
