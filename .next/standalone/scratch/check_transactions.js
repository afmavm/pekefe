const fs = require('fs');
const path = require('path');

function checkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    const s = fs.statSync(p);
    if (s.isDirectory()) checkDir(p);
    else if (p.endsWith('.ts') || p.endsWith('.js')) {
      const c = fs.readFileSync(p, 'utf8');
      if (c.includes('$transaction(async') && !c.includes('timeout:')) {
        console.log('WITHOUT TIMEOUT:', p);
      }
    }
  }
}

checkDir('./src/app/api');
