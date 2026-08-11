const fs = require('fs');
const path = require('path');

console.log("[POSTBUILD] Syncing static assets into Next.js standalone bundle...");

const standaloneDir = path.join(__dirname, '../.next/standalone');
if (fs.existsSync(standaloneDir)) {
  // 1. Copy public directory to .next/standalone/public
  const srcPublic = path.join(__dirname, '../public');
  const destPublic = path.join(standaloneDir, 'public');
  if (fs.existsSync(srcPublic)) {
    fs.cpSync(srcPublic, destPublic, { recursive: true, force: true });
    console.log("[POSTBUILD] Copied public/ -> .next/standalone/public/");
  }

  // 2. Copy .next/static directory to .next/standalone/.next/static
  const srcStatic = path.join(__dirname, '../.next/static');
  const destStatic = path.join(standaloneDir, '.next', 'static');
  if (fs.existsSync(srcStatic)) {
    fs.mkdirSync(path.dirname(destStatic), { recursive: true });
    fs.cpSync(srcStatic, destStatic, { recursive: true, force: true });
    console.log("[POSTBUILD] Copied .next/static/ -> .next/standalone/.next/static/");
  }

  // 3. Remove any .env files from standalone build to avoid secret leakage
  try {
    const findAndRemoveEnv = (dir) => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          findAndRemoveEnv(fullPath);
        } else if (entry.name.startsWith('.env')) {
          fs.rmSync(fullPath, { force: true });
        }
      }
    };
    findAndRemoveEnv(standaloneDir);
  } catch (e) {}
} else {
  console.log("[POSTBUILD] Standalone directory not found, skipping copy.");
}
