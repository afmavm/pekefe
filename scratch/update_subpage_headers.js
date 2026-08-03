const fs = require('fs');
const path = require('path');

const pages = [
  'src/app/(shop)/b2b/page.js',
  'src/app/(shop)/galeri/page.js',
  'src/app/(shop)/hikayemiz/page.js',
  'src/app/(shop)/iletisim/page.js',
  'src/app/(shop)/kampanyalar/page.js',
  'src/app/(shop)/sss/page.js',
  'src/app/(shop)/tesisimiz/page.js'
];

pages.forEach(p => {
  const fullPath = path.join(process.cwd(), p);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf-8');
    if (content.includes('/ispir-manzara-hero.png')) {
      content = content.replaceAll('/ispir-manzara-hero.png', '/uploads/ispir-yedi-goller-kackar-manzara.webp');
      content = content.replaceAll('brightness-[0.45]', 'brightness-[0.65]');
      content = content.replaceAll('brightness-[0.35]', 'brightness-[0.65]');
      fs.writeFileSync(fullPath, content, 'utf-8');
      console.log('UPDATED HEADER BANNER IN:', p);
    }
  }
});
