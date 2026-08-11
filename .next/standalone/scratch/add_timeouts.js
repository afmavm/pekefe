const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    const s = fs.statSync(p);
    if (s.isDirectory()) processDir(p);
    else if (p.endsWith('.ts') || p.endsWith('.js')) {
      let c = fs.readFileSync(p, 'utf8');
      if (c.includes('$transaction(async') && !c.includes('timeout:')) {
        // Replace }); at the end of $transaction(async (tx) => { ... }); with }, { maxWait: 10000, timeout: 30000 });
        // Let's do regex replacement for `prisma.$transaction(async (`
        const regex = /prisma\.\$transaction\s*\(\s*async\s*\(([^)]*)\)\s*=>\s*\{([\s\S]*?)\}\s*\)/g;
        let modified = c.replace(regex, (match, p1, p2) => {
          if (match.includes('timeout:')) return match;
          return `prisma.$transaction(async (${p1}) => {${p2}}, { maxWait: 10000, timeout: 30000 })`;
        });
        if (modified !== c) {
          fs.writeFileSync(p, modified, 'utf8');
          console.log('UPDATED WITH TIMEOUT:', p);
        }
      }
    }
  }
}

processDir('./src/app/api');
