import sharp from "sharp";
import fs from "node:fs";

const root = process.cwd();

fs.mkdirSync(`${root}/public/icons`, { recursive: true });

async function png(size, dest) {
  const r = Math.round(size * 0.22);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#eec8cf" />
      <stop offset="1" stop-color="#664c6f" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" rx="${r}" fill="url(#g)" />
  <circle cx="50%" cy="50%" r="${Math.round(size * 0.18)}" fill="#fcf8f9" opacity="0.92" />
  <circle cx="${Math.round(size * 0.62)}" cy="${Math.round(size * 0.4)}" r="${Math.round(size * 0.06)}" fill="#cf5b75" opacity="0.95" />
</svg>`;

  await sharp(Buffer.from(svg)).png().toFile(`${root}/${dest}`);
}

await png(512, "public/icons/icon-512.png");
await png(192, "public/icons/icon-192.png");
await png(180, "public/apple-touch-icon.png");

console.log("Wrote icons to public/icons and public/apple-touch-icon.png");
