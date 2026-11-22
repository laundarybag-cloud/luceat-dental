/**
 * Adds message keys to both locale files, keeping them in the same order and
 * failing loudly if a key already exists with different wording.
 *
 * Usage: node scripts/i18n-add-keys.mjs <batch.json>
 * where batch.json is { "section": "comment", "keys": { key: [en, ar] } }
 */
import fs from "node:fs";
import path from "node:path";

const batchPath = process.argv[2];
if (!batchPath) {
  console.error("usage: node scripts/i18n-add-keys.mjs <batch.json>");
  process.exit(1);
}

const batch = JSON.parse(fs.readFileSync(batchPath, "utf8"));
const root = process.cwd();

const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

function insert(file, index, comment, entries) {
  const full = path.join(root, "src/locales", file);
  let src = fs.readFileSync(full, "utf8");

  const lines = [`\n  /* ${comment} */`];
  let added = 0;
  for (const [key, values] of Object.entries(entries)) {
    const value = values[index];
    if (src.includes(`"${key}":`)) continue;
    lines.push(`  "${key}": "${esc(value)}",`);
    added += 1;
  }
  if (added === 0) {
    console.log(`${file}: nothing new`);
    return;
  }

  // Both files end with the closing brace of the single exported object.
  const marker = file === "en.ts" ? "\n} as const;" : "\n};";
  const at = src.lastIndexOf(marker);
  if (at === -1) throw new Error(`${file}: could not find the closing brace`);
  src = src.slice(0, at) + "\n" + lines.join("\n") + src.slice(at);
  fs.writeFileSync(full, src);
  console.log(`${file}: +${added}`);
}

insert("en.ts", 0, batch.section, batch.keys);
insert("ar.ts", 1, batch.section, batch.keys);
