/**
 * Replaces hardcoded English with `t("key")` calls, choosing the right syntax
 * for where the string sits: a JSX attribute, a value in an object literal,
 * JSX text, or a plain string literal.
 *
 * Usage: node scripts/auto-i18n.mjs <dir-or-file> <dictionary.json>
 *   dictionary.json: { "English string": "message.key", ... }
 *
 * Anything it could not place is listed at the end rather than skipped
 * quietly, so a missed string is visible instead of shipping in English.
 */
import fs from "node:fs";
import path from "node:path";

const CR = String.fromCharCode(13);
const target = process.argv[2];
const dict = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));

const files = fs.statSync(target).isDirectory()
  ? fs
      .readdirSync(target)
      .filter((f) => f.endsWith(".tsx"))
      .map((f) => path.join(target, f))
  : [target];

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const applied = new Map();

for (const file of files) {
  let src = fs.readFileSync(file, "utf8").split(CR + "\n").join("\n");
  const before = src;

  for (const [english, key] of Object.entries(dict)) {
    const e = esc(english);
    const call = `t("${key}")`;

    // 1. JSX attribute: label="Text"  ->  label={t("key")}
    src = src.replace(
      new RegExp(`([a-zA-Z-]+)="${e}"`, "g"),
      (_m, attr) => `${attr}={${call}}`
    );

    // 2. Object-literal value: label: "Text"  ->  label: t("key")
    src = src.replace(
      new RegExp(`([a-zA-Z]+):\\s*"${e}"`, "g"),
      (_m, prop) => `${prop}: ${call}`
    );

    // 3. JSX text between tags, alone on its own line(s)
    src = src.replace(
      new RegExp(`(>)(\\s*)${e}(\\s*)(<)`, "g"),
      (_m, gt, pre, post, lt) => `${gt}${pre}{${call}}${post}${lt}`
    );

    // 4. Any remaining plain string literal
    src = src.replace(new RegExp(`"${e}"`, "g"), call);

    if (src !== before && !applied.has(english) && !before.includes(call)) {
      applied.set(english, key);
    }
  }

  fs.writeFileSync(file, src);
}

// Report what is still sitting in the source untranslated.
const leftover = [];
for (const english of Object.keys(dict)) {
  const stillThere = files.some((f) =>
    fs.readFileSync(f, "utf8").includes(`"${english}"`)
  );
  const asText = files.some((f) => {
    const s = fs.readFileSync(f, "utf8");
    return new RegExp(`>\\s*${esc(english)}\\s*<`).test(s);
  });
  if (stillThere || asText) leftover.push(english);
}

console.log(`${files.length} file(s) processed`);
if (leftover.length) {
  console.log(`\nSTILL ENGLISH (${leftover.length}):`);
  for (const l of leftover) console.log(`  ${l}`);
} else {
  console.log("no dictionary entry left untranslated");
}
