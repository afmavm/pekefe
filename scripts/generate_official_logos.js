const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'public', 'logos');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// 1. Yurtiçi Kargo Official Vector SVG (200x60)
const yurticiSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" rx="10" fill="#002548"/>
  <g transform="translate(12, 10)">
    <path d="M0 40L14 0H26L12 40H0Z" fill="#E30613"/>
    <path d="M14 40L28 0H40L26 40H14Z" fill="#FFD100"/>
    <path d="M28 40L42 0H54L40 40H28Z" fill="#E30613"/>
  </g>
  <text x="76" y="34" font-family="'Helvetica Neue', Arial, sans-serif" font-style="italic" font-weight="900" font-size="20" fill="#FFFFFF" letter-spacing="-0.5">Yurtiçi</text>
  <text x="76" y="48" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="11" fill="#FFD100" letter-spacing="2">KARGO</text>
</svg>`;

// 2. Aras Kargo Official Vector SVG (200x60)
const arasSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" rx="10" fill="#E30613"/>
  <g transform="translate(12, 12)">
    <circle cx="18" cy="18" r="18" fill="#FFFFFF"/>
    <path d="M12 10L24 18L12 26Z" fill="#E30613"/>
    <path d="M20 10L32 18L20 26Z" fill="#E30613" opacity="0.4"/>
  </g>
  <text x="58" y="39" font-family="'Trebuchet MS', Arial, sans-serif" font-weight="900" font-size="26" fill="#FFFFFF" letter-spacing="-1">aras</text>
  <text x="116" y="39" font-family="'Trebuchet MS', Arial, sans-serif" font-weight="900" font-size="26" fill="#002855" letter-spacing="-0.5">kargo</text>
</svg>`;

// 3. MNG Kargo Official Vector SVG (200x60)
const mngSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" rx="10" fill="#001B36"/>
  <g transform="translate(12, 12)">
    <path d="M0 28C8 10 22 0 36 0C22 10 14 22 11 34Z" fill="#FF6A00"/>
    <path d="M8 28C16 12 28 4 42 4C28 14 20 24 17 34Z" fill="#00A8E8"/>
  </g>
  <text x="60" y="39" font-family="'Arial Black', Gadget, sans-serif" font-weight="900" font-size="26" fill="#00A8E8" letter-spacing="-1">MNG</text>
  <text x="132" y="39" font-family="'Arial Black', Gadget, sans-serif" font-weight="900" font-size="18" fill="#FFFFFF" letter-spacing="1">KARGO</text>
</svg>`;

// 4. PTT Kargo Official Vector SVG (200x60)
const pttSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" rx="10" fill="#FFC700"/>
  <g transform="translate(10, 10)">
    <rect width="70" height="40" rx="20" fill="#002B49"/>
    <text x="35" y="29" font-family="'Arial Black', sans-serif" font-weight="900" font-size="20" fill="#FFC700" text-anchor="middle">Ptt</text>
  </g>
  <text x="90" y="39" font-family="'Arial Black', sans-serif" font-weight="900" font-size="24" fill="#002B49" letter-spacing="-0.5">KARGO</text>
  <path d="M90 44 H185" stroke="#E30613" stroke-width="3" stroke-linecap="round"/>
</svg>`;

// 5. Sürat Kargo Official Vector SVG (200x60)
const suratSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" rx="10" fill="#D91219"/>
  <g transform="translate(12, 10)">
    <path d="M0 38L12 0H22L10 38H0Z" fill="#FFD100"/>
    <path d="M10 38L22 0H32L20 38H10Z" fill="#FFFFFF"/>
  </g>
  <text x="52" y="37" font-family="'Arial Black', sans-serif" font-style="italic" font-weight="900" font-size="22" fill="#FFFFFF">SÜRAT</text>
  <text x="135" y="37" font-family="'Arial Black', sans-serif" font-style="italic" font-weight="900" font-size="16" fill="#FFD100">KARGO</text>
</svg>`;

// 6. HepsiJET Official Vector SVG (200x60)
const hepsijetSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" rx="10" fill="#FF6000"/>
  <g transform="translate(10, 16)">
    <path d="M0 8 H22" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
    <path d="M6 16 H26" stroke="#002B49" stroke-width="3" stroke-linecap="round"/>
    <path d="M3 24 H18" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
  </g>
  <text x="42" y="39" font-family="'Outfit', 'Segoe UI', sans-serif" font-weight="800" font-size="24" fill="#FFFFFF" letter-spacing="-1">hepsi</text>
  <text x="108" y="39" font-family="'Outfit', 'Segoe UI', sans-serif" font-weight="900" font-size="26" fill="#002B49" letter-spacing="-0.5">JET</text>
</svg>`;

fs.writeFileSync(path.join(dir, 'yurtici.svg'), yurticiSvg);
fs.writeFileSync(path.join(dir, 'aras.svg'), arasSvg);
fs.writeFileSync(path.join(dir, 'mng.svg'), mngSvg);
fs.writeFileSync(path.join(dir, 'ptt.svg'), pttSvg);
fs.writeFileSync(path.join(dir, 'surat.svg'), suratSvg);
fs.writeFileSync(path.join(dir, 'hepsijet.svg'), hepsijetSvg);

console.log("Official brand vector logos successfully generated in public/logos/!");
