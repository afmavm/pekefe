const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'public', 'logos');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// 1. Yurtiçi Kargo Official Vector SVG
const yurticiSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 80" width="300" height="80">
  <rect width="300" height="80" rx="12" fill="#002548"/>
  <g transform="translate(18, 16)">
    <!-- Slanted double parallelograms (Yurtiçi Emblem) -->
    <path d="M0 48L18 0H34L16 48H0Z" fill="#E30613"/>
    <path d="M18 48L36 0H52L34 48H18Z" fill="#FFD100"/>
    <path d="M36 48L54 0H70L52 48H36Z" fill="#E30613"/>
  </g>
  <!-- Text -->
  <text x="100" y="44" font-family="'Helvetica Neue', Arial, sans-serif" font-style="italic" font-weight="900" font-size="28" fill="#FFFFFF" letter-spacing="-0.5">Yurtiçi</text>
  <text x="100" y="62" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="14" fill="#FFD100" letter-spacing="3">KARGO</text>
</svg>`;

// 2. Aras Kargo Official Vector SVG
const arasSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 80" width="300" height="80">
  <rect width="300" height="80" rx="12" fill="#E30613"/>
  <!-- Aras Emblem Circle with Arrow -->
  <g transform="translate(20, 16)">
    <circle cx="24" cy="24" r="24" fill="#FFFFFF"/>
    <!-- Red Chevron Arrow -->
    <path d="M16 13L32 24L16 35Z" fill="#E30613"/>
    <path d="M26 13L42 24L26 35Z" fill="#E30613" opacity="0.4"/>
  </g>
  <!-- Aras Typography -->
  <text x="82" y="52" font-family="'Trebuchet MS', Arial, sans-serif" font-weight="900" font-size="34" fill="#FFFFFF" letter-spacing="-1">aras</text>
  <text x="160" y="52" font-family="'Trebuchet MS', Arial, sans-serif" font-weight="900" font-size="34" fill="#002855" letter-spacing="-0.5">kargo</text>
</svg>`;

// 3. MNG Kargo Official Vector SVG
const mngSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 80" width="300" height="80">
  <rect width="300" height="80" rx="12" fill="#001B36"/>
  <!-- MNG Wave / Wings Emblem -->
  <g transform="translate(18, 18)">
    <path d="M0 36C12 12 30 0 48 0C30 14 20 28 16 44Z" fill="#FF6A00"/>
    <path d="M10 36C22 16 38 6 54 6C38 18 28 30 24 44Z" fill="#00A8E8"/>
  </g>
  <!-- MNG Typography -->
  <text x="80" y="52" font-family="'Arial Black', Gadget, sans-serif" font-weight="900" font-size="36" fill="#00A8E8" letter-spacing="-1">MNG</text>
  <text x="180" y="52" font-family="'Arial Black', Gadget, sans-serif" font-weight="900" font-size="24" fill="#FFFFFF" letter-spacing="1">KARGO</text>
</svg>`;

// 4. PTT Kargo Official Vector SVG
const pttSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 80" width="300" height="80">
  <rect width="300" height="80" rx="12" fill="#FFC700"/>
  <!-- PTT Oval Seal -->
  <g transform="translate(16, 12)">
    <rect width="100" height="56" rx="28" fill="#002B49"/>
    <text x="50" y="40" font-family="'Arial Black', sans-serif" font-weight="900" font-size="28" fill="#FFC700" text-anchor="middle">Ptt</text>
  </g>
  <!-- Ptt Kargo Text -->
  <text x="130" y="53" font-family="'Arial Black', sans-serif" font-weight="900" font-size="34" fill="#002B49" letter-spacing="-0.5">KARGO</text>
  <path d="M130 60 H275" stroke="#E30613" stroke-width="4" stroke-linecap="round"/>
</svg>`;

// 5. Sürat Kargo Official Vector SVG
const suratSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 80" width="300" height="80">
  <rect width="300" height="80" rx="12" fill="#D91219"/>
  <!-- Dynamic Speed Slashes -->
  <g transform="translate(18, 15)">
    <path d="M0 48L15 0H28L13 48H0Z" fill="#FFD100"/>
    <path d="M12 48L27 0H40L25 48H12Z" fill="#FFFFFF"/>
  </g>
  <!-- Sürat Kargo Text -->
  <text x="72" y="48" font-family="'Arial Black', sans-serif" font-style="italic" font-weight="900" font-size="28" fill="#FFFFFF">SÜRAT</text>
  <text x="185" y="48" font-family="'Arial Black', sans-serif" font-style="italic" font-weight="900" font-size="22" fill="#FFD100">KARGO</text>
</svg>`;

// 6. HepsiJET Official Vector SVG
const hepsijetSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 80" width="300" height="80">
  <rect width="300" height="80" rx="12" fill="#FF6000"/>
  <!-- Jet Stream Speed Lines -->
  <g transform="translate(16, 22)">
    <path d="M0 12 H30" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
    <path d="M8 24 H36" stroke="#002B49" stroke-width="4" stroke-linecap="round"/>
    <path d="M4 36 H24" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
  </g>
  <!-- HepsiJET Text -->
  <text x="60" y="52" font-family="'Outfit', 'Segoe UI', sans-serif" font-weight="800" font-size="32" fill="#FFFFFF" letter-spacing="-1">hepsi</text>
  <text x="145" y="52" font-family="'Outfit', 'Segoe UI', sans-serif" font-weight="900" font-size="34" fill="#002B49" letter-spacing="-0.5">JET</text>
</svg>`;

fs.writeFileSync(path.join(dir, 'yurtici.svg'), yurticiSvg);
fs.writeFileSync(path.join(dir, 'aras.svg'), arasSvg);
fs.writeFileSync(path.join(dir, 'mng.svg'), mngSvg);
fs.writeFileSync(path.join(dir, 'ptt.svg'), pttSvg);
fs.writeFileSync(path.join(dir, 'surat.svg'), suratSvg);
fs.writeFileSync(path.join(dir, 'hepsijet.svg'), hepsijetSvg);

console.log("Official brand vector logos successfully generated in public/logos/");
