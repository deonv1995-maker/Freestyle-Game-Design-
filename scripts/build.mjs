import { cp, copyFile, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const dist = resolve(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await copyFile(resolve(root, "index.html"), resolve(dist, "index.html"));
await copyFile(resolve(root, "privacy.html"), resolve(dist, "privacy.html"));
await copyFile(resolve(root, "site.webmanifest"), resolve(dist, "site.webmanifest"));
await cp(resolve(root, "src"), resolve(dist, "src"), { recursive: true });
await cp(resolve(root, "assets"), resolve(dist, "assets"), { recursive: true });

console.log("Built static prototype into dist/");
