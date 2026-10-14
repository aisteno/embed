import { build } from "esbuild";
import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const sourceFiles = ["steno-chat.js", "steno-button.js", "niro.js"];
const distDir = path.resolve("dist");
const buildVersion = process.env.BUILD_VERSION?.trim();

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
  copyFile("_headers", path.join(distDir, "_headers")),
  writeFile(path.join(distDir, ".nojekyll"), ""),
]);

// Cloudflare serves the runtime directly. Only the legacy jsDelivr release
// replaces its chat entry point with this small, stable loader.
await mkdir(path.join(distDir, "jsdelivr"), { recursive: true });
await build({
  entryPoints: ["scripts/jsdelivr-loader.js"],
  outfile: path.join(distDir, "jsdelivr", "steno-chat.js"),
  charset: "ascii",
  legalComments: "none",
  minify: true,
  platform: "browser",
  target: ["es2018"],
});
await copyFile(
  path.join(distDir, "steno-chat.js"),
  path.join(distDir, "jsdelivr", "steno-chat-runtime.js"),
);

if (buildVersion) {
  const versionDir = path.join(distDir, "v", buildVersion);
  await mkdir(versionDir, { recursive: true });
  await Promise.all(
    sourceFiles.map((file) =>
      copyFile(path.join(distDir, file), path.join(versionDir, file)),
    ),
  );
}
