/**
 * Translates table column headers only — `header: "Status"` becomes
 * `header: t("col.status")`. Deliberately narrow: words like "Status" and
 * "Date" appear as object keys and type members elsewhere, and a blanket
 * string replacement would rewrite those too.
 *
 * Usage: node scripts/headers-i18n.mjs <dictionary.json> <file> [...]
 */
import fs from "node:fs";

const CR = String.fromCharCode(13);
const [dictPath, ...files] = process.argv.slice(2);
const dict = JSON.parse(fs.readFileSync(dictPath, "utf8"));

const unknown = new Set();

for (const file of files) {
  let src = fs.readFileSync(file, "utf8").split(CR + "\n").join("\n");
  src = src.replace(/header: "([^"]*)"/g, (whole, text) => {
    if (text === "") return whole; // the actions column has no heading
    const key = dict[text];
    if (!key) {
      unknown.add(text);
      return whole;
    }
    return `header: t("${key}")`;
  });
  fs.writeFileSync(file, src);
}

if (unknown.size) {
  console.log("NO KEY FOR:");
  for (const u of unknown) console.log(`  ${u}`);
} else {
  console.log("every header translated");
}
