import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

fs.mkdirSync(`${root}/public/pwa`, { recursive: true });

function readSvg(relPath) {
  const abs = path.join(root, relPath);
  return fs.readFileSync(abs);
}

async function renderIcon({ srcSvg, size, destPng, background }){
  const svg = readSvg(srcSvg);
  const s = sharp(svg, { density: 512 });
  const img = background ? s.flatten({ background }) : s;
  await img.resize(size, size).png({ compressionLevel: 9 }).toFile(path.join(root, destPng));
}

await renderIcon({ srcSvg: "public/pwa/icon.svg", size: 512, destPng: "public/pwa/icon-512.png", background: "#0c0a12" });
await renderIcon({ srcSvg: "public/pwa/icon.svg", size: 192, destPng: "public/pwa/icon-192.png", background: "#0c0a12" });
await renderIcon({ srcSvg: "public/pwa/icon.svg", size: 180, destPng: "public/apple-touch-icon.png", background: "#0c0a12" });

console.log("Wrote icons to public/pwa and public/apple-touch-icon.png");
