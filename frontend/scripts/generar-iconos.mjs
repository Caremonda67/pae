// Genera los iconos PNG de la PWA a partir de public/icon.svg.
// Uso: node scripts/generar-iconos.mjs
// Crea: pwa-192x192.png, pwa-512x512.png, maskable-512x512.png y apple-touch-icon.png
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
const svg = path.join(publicDir, "icon.svg");

// version "any": se muestra tal cual (con las esquinas redondeadas)
const tamanos = [
  { nombre: "pwa-192x192.png", ancho: 192 },
  { nombre: "pwa-512x512.png", ancho: 512 },
];

// version maskable: rellena todo el lienzo para que el launcher
// recorte sin dejar bordes blancos
const maskable = 512;

for (const t of tamanos) {
  await sharp(svg).resize(t.ancho, t.ancho).png().toFile(path.join(publicDir, t.nombre));
  console.log("OK", t.nombre);
}

// apple-touch-icon: sin bordes, relleno completo (iOS no respeta radios)
await sharp(svg)
  .resize(180, 180)
  .png()
  .toFile(path.join(publicDir, "apple-touch-icon.png"));
console.log("OK apple-touch-icon.png");

// icono maskable: fondo verde a borde completo (sin recorte de radio)
const maskableSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${maskable}" height="${maskable}" viewBox="0 0 512 512">
     <rect width="512" height="512" fill="#2e9e6b"/>
     <circle cx="256" cy="300" r="150" fill="#ffffff"/>
     <circle cx="256" cy="300" r="120" fill="none" stroke="#e0e7dd" stroke-width="6"/>
     <circle cx="256" cy="300" r="78" fill="none" stroke="#e0e7dd" stroke-width="6"/>
     <g stroke="#2e9e6b" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" fill="none">
       <path d="M256 100 v78"/>
       <path d="M256 120 c-18 0 -30 -12 -30 -26 v-8 c14 0 26 12 26 26 z"/>
       <path d="M256 120 c18 0 30 -12 30 -26 v-8 c-14 0 -26 12 -26 26 z"/>
     </g>
   </svg>`
);
await sharp(maskableSvg).png().toFile(path.join(publicDir, "maskable-512x512.png"));
console.log("OK maskable-512x512.png");
