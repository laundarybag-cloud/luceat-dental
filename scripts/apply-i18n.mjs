/**
 * Applies a replacement map to a file and reports anything that did not match,
 * so a missed string is never silently left in English.
 *
 * Usage: node scripts/apply-i18n.mjs <map.json>
 *   { "<file>": { "needle": "replacement", ... }, ... }
 */
import fs from "node:fs";

const CR = String.fromCharCode(13);

const map = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
let missed = 0;

for (const [file, pairs] of Object.entries(map)) {
  if (!fs.existsSync(file)) {
    console.log(`MISSING FILE ${file}`);
    missed += 1;
    continue;
  }
  // Some files still carry CRLF from the original scaffold while others were
  // normalised by earlier passes. Everything is matched and written as LF so
  // a needle written here works against either.
  let src = fs.readFileSync(file, "utf8").split(CR + "\n").join("\n");
  const notFound = [];
  for (const [needle, repl] of Object.entries(pairs)) {
    if (!src.includes(needle)) {
      notFound.push(needle);
      continue;
    }
    src = src.split(needle).join(repl);
  }
  fs.writeFileSync(file, src);
  if (notFound.length) {
    console.log(`\n${file}`);
    for (const n of notFound) console.log(`  NOT FOUND: ${n.slice(0, 70)}`);
    missed += notFound.length;
  }
}
console.log(
  missed === 0 ? "\nall replacements applied" : `\n${missed} not applied`
);
