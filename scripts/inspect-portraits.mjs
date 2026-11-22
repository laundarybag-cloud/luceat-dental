// Reports background saturation for each portrait so loud studio backdrops
// (which clash with the Luceat palette) can be spotted and replaced.
import sharp from "sharp";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const dirs = ["public/images/doctors", "public/images/patients"];

for (const dir of dirs) {
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".jpg"))) {
    const p = join(dir, file);
    const { data, info } = await sharp(p)
      .resize(24, 24, { fit: "fill" })
      .raw()
      .toBuffer({ resolveWithObject: true });
    // sample the border ring only (background)
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = 0; y < 24; y++) {
      for (let x = 0; x < 24; x++) {
        if (x > 3 && x < 20 && y > 3) continue; // skip the subject area
        const i = (y * 24 + x) * info.channels;
        r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
      }
    }
    r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    console.log(
      `${sat > 0.25 ? "LOUD " : "ok   "} ${p.padEnd(34)} rgb(${r},${g},${b}) sat=${sat.toFixed(2)}`
    );
  }
}
