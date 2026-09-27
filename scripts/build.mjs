import { cp, copyFile, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const dist = resolve(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await copyFile(resolve(root, "index.html"), resolve(dist, "index.html"));
await cp(resolve(root, "src"), resolve(dist, "src"), { recursive: true });

console.log("Built static prototype into dist/");
