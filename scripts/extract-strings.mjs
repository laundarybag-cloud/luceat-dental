/**
 * Lists the user-visible English strings still hardcoded in a module, so a
 * translation pass can be planned without reading every line.
 *
 * Usage: node scripts/extract-strings.mjs src/components/<module>
 */
import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2];
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))
  .map((f) => path.join(dir, f));

const ATTRS =
  /\b(title|label|description|placeholder|hint|aria-label|sublabel|detail|emptyLabel|heading)="([^"{}]{2,120})"/g;
// Object/array literal copy: `label: "Confirmed"`, `name: "Crown fitting"`
const PROPS =
  /\b(label|name|title|description|hint|detail|summary|copy|text|cta)\s*:\s*"([^"]{2,120})"/g;
// Bare JSX text that starts with a capital and contains a space or is a word
const JSXTEXT = />\s*([A-Z][A-Za-z0-9''&,.\-—·()/%+ ]{2,110}?)\s*</g;

for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  const hits = new Set();
  for (const re of [ATTRS, PROPS]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src))) hits.add(m[2].trim());
  }
  JSXTEXT.lastIndex = 0;
  let m;
  while ((m = JSXTEXT.exec(src))) {
    const s = m[1].trim();
    // Skip anything that is plainly code or a single stray capital
    if (/^[A-Z][a-z]*$/.test(s) && s.length < 3) continue;
    hits.add(s);
  }
  if (hits.size === 0) continue;
  console.log(`\n### ${path.basename(file)}  (${hits.size})`);
  for (const h of [...hits].sort()) console.log(`  ${h}`);
}
