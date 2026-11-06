import { readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(dir + "/" + e.name) : [dir + "/" + e.name],
  );
}
for (const f of [
  ...walk("src"),
  ...walk("public/js"),
  ...walk("scripts"),
  ...walk("tests"),
]) {
  if (!/\.(js|mjs)$/.test(f)) continue;
  const r = spawnSync(process.execPath, ["--check", f], { encoding: "utf8" });
  if (r.status !== 0) {
    console.error(r.stderr);
    process.exit(1);
  }
  if (/^<<<<<<< |^=======|^>>>>>>> /m.test(readFileSync(f, "utf8")))
    throw new Error("Conflito: " + f);
}
console.log("Sintaxe e conflitos: OK");
