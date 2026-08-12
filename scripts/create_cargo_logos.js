const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'public', 'logos');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const yurticiSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" rx="8" fill="#003865"/>
  <path d="M30 42L45 18H60L45 42H30Z" fill="#E30613"/>
  <path d="M48 42L63 18H78L63 42H48Z" fill="#FFD100"/>
  <text x="85" y="38" font-family="Arial, sans-serif" font-weight="900" font-size="20" fill="#FFFFFF">Yurtiçi</text>
  <text x="85" y="49" font-family="Arial, sans-serif" font-weight="700" font-size="10" fill="#FFD100">KARGO</text>
</svg>`;

const arasSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" rx="8" fill="#E30613"/>
  <circle cx="40" cy="30" r="18" fill="#FFFFFF"/>
  <path d="M30 30L50 20V40Z" fill="#E30613"/>
  <text x="70" y="38" font-family="Arial, sans-serif" font-weight="900" font-size="22" fill="#FFFFFF">aras</text>
  <text x="125" y="38" font-family="Arial, sans-serif" font-weight="900" font-size="14" fill="#003865">kargo</text>
</svg>`;

const mngSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" rx="8" fill="#002B49"/>
  <text x="25" y="40" font-family="Arial, sans-serif" font-weight="900" font-size="26" fill="#00A3E0">MNG</text>
  <text x="95" y="40" font-family="Arial, sans-serif" font-weight="900" font-size="20" fill="#FFFFFF">KARGO</text>
</svg>`;

const pttSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" rx="8" fill="#FFCC00"/>
  <text x="35" y="42" font-family="Arial, sans-serif" font-weight="900" font-size="30" fill="#002B49">PTT</text>
  <text x="105" y="42" font-family="Arial, sans-serif" font-weight="800" font-size="16" fill="#E30613">Kargo</text>
</svg>`;

const suratSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" rx="8" fill="#ED1C24"/>
  <text x="25" y="38" font-family="Arial, sans-serif" font-weight="900" font-size="22" fill="#FFFFFF">SÜRAT</text>
  <text x="110" y="38" font-family="Arial, sans-serif" font-weight="700" font-size="16" fill="#FFD100">KARGO</text>
</svg>`;

const hepsijetSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" rx="8" fill="#FF6000"/>
  <text x="25" y="38" font-family="Arial, sans-serif" font-weight="900" font-size="22" fill="#FFFFFF">hepsi</text>
  <text x="90" y="38" font-family="Arial, sans-serif" font-weight="900" font-size="22" fill="#002B49">JET</text>
</svg>`;

fs.writeFileSync(path.join(dir, 'yurtici.svg'), yurticiSvg);
fs.writeFileSync(path.join(dir, 'aras.svg'), arasSvg);
fs.writeFileSync(path.join(dir, 'mng.svg'), mngSvg);
fs.writeFileSync(path.join(dir, 'ptt.svg'), pttSvg);
fs.writeFileSync(path.join(dir, 'surat.svg'), suratSvg);
fs.writeFileSync(path.join(dir, 'hepsijet.svg'), hepsijetSvg);

console.log("Vector cargo logos generated under public/logos/");
