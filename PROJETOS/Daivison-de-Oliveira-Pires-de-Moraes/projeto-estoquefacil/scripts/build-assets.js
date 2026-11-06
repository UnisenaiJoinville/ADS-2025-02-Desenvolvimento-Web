import { cp, mkdir } from "node:fs/promises";
const files = {
  "node_modules/axios/dist/esm/axios.min.js": "axios.js",
  "node_modules/vue/dist/vue.global.prod.js": "vue.js",
  "node_modules/chart.js/dist/chart.umd.js": "chart.js",
  "node_modules/lucide/dist/umd/lucide.js": "lucide.js",
};
await mkdir("public/vendor", { recursive: true });
for (const [source, dest] of Object.entries(files))
  await cp(source, "public/vendor/" + dest);

for (const [source, dest] of Object.entries({
  "node_modules/axios/LICENSE": "axios-LICENSE.txt",
  "node_modules/vue/LICENSE": "vue-LICENSE.txt",
  "node_modules/chart.js/LICENSE.md": "chart-LICENSE.txt",
  "node_modules/lucide/LICENSE": "lucide-LICENSE.txt",
}))
  await cp(source, "public/vendor/" + dest);
