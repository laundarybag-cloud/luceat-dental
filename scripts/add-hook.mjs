/**
 * Inserts `const { t } = useI18n();` (optionally with `fmt`) as the first
 * statement of the named components, and adds the import once.
 *
 * Usage: node scripts/add-hook.mjs <file> <Component[:fmt]> [...]
 */
import fs from "node:fs";

const CR = String.fromCharCode(13);
const [file, ...names] = process.argv.slice(2);
let src = fs.readFileSync(file, "utf8").split(CR + "\n").join("\n");

const IMPORT = 'import { useI18n } from "@/components/i18n/locale-context";';
if (!src.includes(IMPORT)) {
  // Place it after the final import so the block stays tidy.
  const lines = src.split("\n");
  let last = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (/^import .*;$/.test(lines[i]) || /^} from ".*";$/.test(lines[i])) last = i;
  }
  lines.splice(last + 1, 0, IMPORT);
  src = lines.join("\n");
}

if (!src.startsWith('"use client"')) {
  src = '"use client";\n\n' + src;
}

for (const spec of names) {
  const [name, extra] = spec.split(":");
  const re = new RegExp(
    `((?:export )?function ${name}\\([\\s\\S]*?\\)\\s*\\{)`,
    "m"
  );
  const m = src.match(re);
  if (!m) {
    console.log(`  NOT FOUND: component ${name}`);
    continue;
  }
  const after = src.slice(m.index + m[0].length, m.index + m[0].length + 300);
  if (after.includes("useI18n()")) continue;
  const hook = extra
    ? `\n  const { t, ${extra} } = useI18n();`
    : "\n  const { t } = useI18n();";
  src = src.slice(0, m.index + m[0].length) + hook + src.slice(m.index + m[0].length);
}

fs.writeFileSync(file, src);
console.log(`hooked ${file}`);
