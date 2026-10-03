// 一次性资产转换：生成的 PNG → 运行时 webp
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, "../..");

const jobs = [
  {
    src: path.join(dir, "assets", "Epic_cinematic_dark_fantasy_ca_2026-10-01T11-55-26.png"),
    dest: path.join(root, "src", "assets", "runtime", "table-cinematic.webp"),
    width: 1536,
    quality: 80,
  },
  {
    src: path.join(dir, "assets", "Ornate_playing_card_back_desig_2026-10-01T11-56-02.png"),
    dest: path.join(root, "src", "assets", "runtime", "card-back.webp"),
    width: 512,
    quality: 82,
  },
];

for (const job of jobs) {
  const info = await sharp(job.src)
    .resize({ width: job.width, withoutEnlargement: true })
    .webp({ quality: job.quality })
    .toFile(job.dest);
  console.log(path.basename(job.dest), `${(info.size / 1024).toFixed(1)}KB`, `${info.width}x${info.height}`);
}
