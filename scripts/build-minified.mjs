import { build } from "esbuild";
import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const sourceFiles = ["steno-chat.js", "steno-button.js", "niro.js"];
const distDir = path.resolve("dist");
const buildVersion = process.env.BUILD_VERSION?.trim();

const headers = [
  "/steno-chat.js",
  "  Cache-Control: public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
  "",
  "/steno-button.js",
  "  Cache-Control: public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
  "",
  "/niro.js",
  "  Cache-Control: public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
  "",
  "/v/*",
  "  Cache-Control: public, max-age=31536000, immutable",
  "",
].join("\n");

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

await build({
  bundle: false,
  charset: "ascii",
  entryPoints: sourceFiles,
  legalComments: "none",
  minify: true,
  outdir: distDir,
  platform: "browser",
  target: ["es2018"],
});

await Promise.all([
  copyFile("index.html", path.join(distDir, "index.html")),
  writeFile(path.join(distDir, "_headers"), headers),
  writeFile(path.join(distDir, ".nojekyll"), ""),
]);

if (buildVersion) {
  const versionDir = path.join(distDir, "v", buildVersion);
  await mkdir(versionDir, { recursive: true });
  await Promise.all(
    sourceFiles.map((file) =>
      copyFile(path.join(distDir, file), path.join(versionDir, file)),
    ),
  );
}
