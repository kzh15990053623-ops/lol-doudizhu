import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = path.join(projectRoot, "dist");
const completeBudget = 4 * 1024 * 1024;
const noVoiceBudget = 1.5 * 1024 * 1024;
const forbiddenPatterns = [/\.png$/i, /\.ogg$/i, /\.map$/i, /atlas/i, /share-server/i, /package\.json$/i, /test/i];

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? listFiles(target) : [target];
    }),
  );
  return nested.flat();
}

const files = await listFiles(distRoot);
const records = await Promise.all(files.map(async (file) => ({ file, bytes: (await stat(file)).size })));
const completeBytes = records.reduce((total, record) => total + record.bytes, 0);
const noVoiceBytes = records.filter((record) => path.extname(record.file).toLowerCase() !== ".mp3").reduce((total, record) => total + record.bytes, 0);
const forbidden = records
  .map((record) => path.relative(distRoot, record.file).replaceAll("\\", "/"))
  .filter((file) => forbiddenPatterns.some((pattern) => pattern.test(file)));

if (completeBytes > completeBudget) throw new Error(`dist exceeds 4 MiB: ${completeBytes} bytes`);
if (noVoiceBytes > noVoiceBudget) throw new Error(`non-voice runtime assets exceed 1.5 MiB: ${noVoiceBytes} bytes`);
if (forbidden.length) throw new Error(`forbidden runtime files: ${forbidden.join(", ")}`);

console.log(`dist: ${(completeBytes / 1024 / 1024).toFixed(2)} MiB / 4.00 MiB`);
console.log(`runtime excluding voice: ${(noVoiceBytes / 1024 / 1024).toFixed(2)} MiB / 1.50 MiB`);
console.log(`files: ${records.length}; forbidden runtime files: 0`);
