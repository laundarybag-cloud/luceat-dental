/**
 * Removes `const { t } = useI18n();` from components that ended up not using
 * it, and drops the import when nothing in the file needs it. Keeps the hook
 * where `fmt` or `locale` is destructured and used.
 *
 * Usage: node scripts/prune-hooks.mjs <file> [...]
 */
import fs from "node:fs";

const CR = String.fromCharCode(13);

for (const file of process.argv.slice(2)) {
  let src = fs.readFileSync(file, "utf8").split(CR + "\n").join("\n");
  const lines = src.split("\n");
  const keep = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const m = line.match(/^\s*const \{ ([^}]+) \} = useI18n\(\);\s*$/);
    if (!m) {
      keep.push(line);
      continue;
    }
    // Scope = from here to the next top-level function, roughly.
    let end = lines.length;
    for (let j = i + 1; j < lines.length; j += 1) {
      if (/^(export )?function /.test(lines[j])) {
        end = j;
        break;
      }
    }
    const body = lines.slice(i + 1, end).join("\n");
    const names = m[1].split(",").map((s) => s.trim());
    const used = names.filter((n) =>
      new RegExp(`\\b${n}\\s*[(.]`).test(body)
    );
    if (used.length === 0) continue; // drop the line entirely
    if (used.length !== names.length) {
      keep.push(line.replace(m[1], used.join(", ")));
      continue;
    }
    keep.push(line);
  }

  src = keep.join("\n");
  if (!src.includes("useI18n()")) {
    src = src
      .split('import { useI18n } from "@/components/i18n/locale-context";\n')
      .join("");
  }
  fs.writeFileSync(file, src);
}
console.log("pruned");
