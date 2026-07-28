const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath);
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('admin') && (line.includes('${') || line.includes('redirect') || line.includes('locale') || line.includes('href') || line.includes('push'))) {
          console.log(`${fullPath}:${index + 1} -> ${line.trim()}`);
        }
      });
    }
  }
}

searchDir('./src');
