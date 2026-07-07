import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(__dirname, "../../src/assets");
const dest = path.resolve(__dirname, "../seed-assets");

if (!fs.existsSync(src)) {
  if (fs.existsSync(dest)) {
    console.log("src/assets not in build context; using committed seed-assets");
    process.exit(0);
  }
  console.warn("No src/assets and no seed-assets folder found");
  process.exit(0);
}

fs.mkdirSync(dest, { recursive: true });
for (const file of fs.readdirSync(src)) {
  const from = path.join(src, file);
  if (!fs.statSync(from).isFile()) continue;
  fs.copyFileSync(from, path.join(dest, file));
}
console.log(`Synced ${fs.readdirSync(dest).length} files to seed-assets/`);
