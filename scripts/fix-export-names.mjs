import { promises as fs } from "node:fs";
import path from "node:path";

const OUT = path.resolve("out");

async function findBrokenDirs(dir, found = []) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const full = path.join(dir, e.name);
    if (e.name.startsWith("__next.")) found.push(full);
    else await findBrokenDirs(full, found);
  }
  return found;
}

async function listFiles(dir, base = dir, files = []) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await listFiles(full, base, files);
    else files.push(path.relative(base, full));
  }
  return files;
}

const broken = await findBrokenDirs(OUT);
let fixed = 0;
for (const dir of broken) {
  const parent = path.dirname(dir);
  const prefix = path.basename(dir);
  for (const rel of await listFiles(dir)) {
    const dotted = `${prefix}.${rel.split(path.sep).join(".")}`;
    await fs.rename(path.join(dir, rel), path.join(parent, dotted));
    fixed++;
  }
  await fs.rm(dir, { recursive: true, force: true });
}
if (fixed) console.log(`fix-export-names: renamed ${fixed} prefetch file(s) to the names Next expects.`);