import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

fs.mkdirSync(`${root}/public/pwa`, { recursive: true });

function readSvg(relPath) {
  const abs = path.join(root, relPath);
  return fs.readFileSync(abs);
}

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return null;
  return process.argv[i + 1] ?? null;
}

function resolveSource() {
  const fromArg = arg("src");
  const fromEnv = process.env.ICON_SRC;
  const relDefaultPng = "public/pwa/icon-source.png";
  const absDefaultPng = path.join(root, relDefaultPng);

  if (fromArg) return { kind: "raster", absPath: path.isAbsolute(fromArg) ? fromArg : path.join(root, fromArg) };
  if (fromEnv) return { kind: "raster", absPath: path.isAbsolute(fromEnv) ? fromEnv : path.join(root, fromEnv) };
  if (fs.existsSync(absDefaultPng)) return { kind: "raster", absPath: absDefaultPng };

  return { kind: "svg", absPath: path.join(root, "public/pwa/icon.svg") };
}

async function renderIcon({ src, size, destPng, background }) {
  const s =
    src.kind === "svg"
      ? sharp(fs.readFileSync(src.absPath), { density: 512 })
      : sharp(fs.readFileSync(src.absPath));

  // Square-crop for app icons; keep it crisp with a solid background.
  const img = (background ? s.flatten({ background }) : s)
    .resize(size, size, { fit: "cover", position: "attention" })
    .png({ compressionLevel: 9 });

  await img.toFile(path.join(root, destPng));
}

const src = resolveSource();

await renderIcon({ src, size: 512, destPng: "public/pwa/icon-512.png", background: "#0c0a12" });
await renderIcon({ src, size: 192, destPng: "public/pwa/icon-192.png", background: "#0c0a12" });
await renderIcon({ src, size: 180, destPng: "public/apple-touch-icon.png", background: "#0c0a12" });

console.log("Wrote icons to public/pwa and public/apple-touch-icon.png");
