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
      if (c.includes('maxWait:')) {
        // Check if maxWait is inside prisma.$transaction( ... , { maxWait: ... }) or misplaced inside tx.something
        const lines = c.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('maxWait:') && !c.slice(Math.max(0, c.indexOf(line) - 500), c.indexOf(line)).includes('prisma.$transaction')) {
            console.log('POSSIBLE MISPLACEMENT:', p, 'Line', idx + 1);
          }
        });
      }
    }
  }
}

checkDir('./src/app/api');
