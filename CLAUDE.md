# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is `aisteno/embed` — a set of standalone JavaScript embed scripts served via jsDelivr CDN (`cdn.jsdelivr.net/gh/aisteno/embed@latest/`). Customers include these scripts on their websites to embed Steno chat widgets as iframes.

Source JS files on `main` are human-readable. A GitHub Actions workflow obfuscates them and publishes to a `release` branch, which is what jsDelivr serves.

## Scripts

- **steno-chat.js** — Primary embed script. Creates a fixed-position iframe pointing at a Steno chat app URL (default `chat.steno.ai`). Handles resize/navigate messages from the iframe via `postMessage`. Supports modes: default (floating button), `panel`, `fullscreen`. Falls back from `panel` to closed on mobile (<768px).
- **steno-button.js** — Alternative embed that shows a custom branded button first, then lazy-loads `steno-chat.js` in panel mode on click. Client-specific styles are defined in `CONFIG.STYLES` keyed by `data-id`.
- **niro.js** — Separate embed for the Niro product (`niro.steno.ai`). Always fullscreen iframe. Simpler than steno-chat (no resize/navigate message handling).
- **index.html** — Local test page for the chat widget.

## How the embed works

Each script is included via a `<script>` tag with `data-*` attributes for configuration:
- `data-id` — chat/client identifier (passed as `?id=` query param to the iframe)
- `data-url` — custom chat URL (must be in `CONFIG.ALLOWED_URLS` allowlist)
- `data-mode` — `default` | `panel` | `fullscreen`
- `data-position` — `left` | `right` | `center`
- `data-backend`, `data-language`, `data-z-index`, `data-cookie-name`, `data-cookie-domain`

## Key patterns

- **ALLOWED_URLS allowlist** in `steno-chat.js` (`CONFIG.ALLOWED_URLS`) must be updated when adding new chat domains. The comment notes this must stay in sync with `/steno-chat/src/utils/constants.ts` in the separate steno-chat app repo.
- **Origin validation** — `postMessage` handler only accepts messages from allowed origins.
- **IIFE pattern** — All scripts wrap in `(function() { ... })()` to avoid global scope pollution.
- **Initialization** — Scripts use `requestIdleCallback` (with fallback) and check `document.readyState` before initializing.
- **Crawler detection** — `steno-chat.js` and `niro.js` skip initialization for bots/crawlers.

## Build & Release

### How it works
1. Push source code to `main` (human-readable JS)
2. GitHub Actions (`.github/workflows/build-and-release.yml`) runs automatically
3. Workflow obfuscates JS files using `javascript-obfuscator` (low-obfuscation preset + RC4 string encoding)
4. Obfuscated files are committed to the `release` branch (root-level, same filenames)
5. A semver tag is created (auto-incremented patch), GitHub Release is published
6. jsDelivr `@latest` resolves to the newest tag on `release`, serving obfuscated files
7. jsDelivr cache is purged so changes propagate immediately

### DRY_RUN mode
The workflow has a `DRY_RUN` env var at the top. When `"true"`, the workflow pushes to the `release` branch but skips tagging, releasing, and cache purging. Use this for safe testing via `cdn.jsdelivr.net/gh/aisteno/embed@release/steno-chat.js`.

### Key rules
- Never edit the `release` branch directly — it's managed by CI
- Never manually create tags — the workflow auto-increments from the latest semver tag
- Source files on `main` are the source of truth
- `dist/` is gitignored — it's only used during CI and local testing

### Local testing
```bash
npm install
mkdir -p dist
for file in steno-chat.js steno-button.js niro.js; do
  npx javascript-obfuscator "$file" --output "dist/$file" \
    --options-preset low-obfuscation --compact true \
    --string-array true --string-array-threshold 1.0 \
    --string-array-encoding rc4 --string-array-rotate true \
    --string-array-shuffle true --string-array-index-shift true \
    --string-array-wrappers-count 2 --string-array-wrappers-type function \
    --dead-code-injection false --self-defending false \
    --control-flow-flattening false --split-strings false \
    --unicode-escape-sequence false --target browser --source-map false
done
```
