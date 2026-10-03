import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(projectRoot, "assets");
const outputRoot = path.join(projectRoot, "src", "assets", "runtime");

const imageJobs = [
  ["runeterra-table-bg-three-seat.png", "table.webp", 78],
  [path.join("ui", "runeterra-hud-frame.png"), path.join("ui", "hud-frame.webp"), 82],
  [path.join("ui", "runeterra-gold-button.png"), path.join("ui", "gold-button.webp"), 84],
  [path.join("ui", "runeterra-tool-orb.png"), path.join("ui", "tool-orb.webp"), 84],
];

const portraitIds = ["garen", "darius", "ashe", "jinx", "caitlyn", "yasuo", "thresh", "azir", "pantheon", "missfortune", "teemo", "kaisa"];
const voiceIds = ["garen", "darius", "ashe", "jinx", "yasuo", "thresh"];

await Promise.all([
  mkdir(path.join(outputRoot, "ui"), { recursive: true }),
  mkdir(path.join(outputRoot, "portraits"), { recursive: true }),
  mkdir(path.join(outputRoot, "voice"), { recursive: true }),
]);

await Promise.all(
  imageJobs.map(async ([source, destination, quality]) => {
    await sharp(path.join(sourceRoot, source))
      .webp({ quality, alphaQuality: 92, effort: 6, smartSubsample: true })
      .toFile(path.join(outputRoot, destination));
  }),
);

await Promise.all(
  portraitIds.map((id) =>
    sharp(path.join(sourceRoot, "portraits", `${id}.jpg`))
      .webp({ quality: 82, effort: 5, smartSubsample: true })
      .toFile(path.join(outputRoot, "portraits", `${id}.webp`)),
  ),
);

await Promise.all(
  voiceIds.map((id) => copyFile(path.join(sourceRoot, "voice", `${id}.mp3`), path.join(outputRoot, "voice", `${id}.mp3`))),
);

console.log(`Optimized runtime assets in ${outputRoot}`);
