# Steno Embed Scripts

Standalone JavaScript embed scripts that add Steno chat widgets to customer websites via iframe. The long-term canonical host is `embed.steno.ai`, with jsDelivr kept as a legacy compatibility path during migration.

## Scripts

| Script | Purpose | CDN URL |
|--------|---------|---------|
| `steno-chat.js` | Primary chat widget (floating button, panel, or fullscreen) | `https://embed.steno.ai/steno-chat.js` |
| `steno-button.js` | Branded button that lazy-loads `steno-chat.js` on click | `https://embed.steno.ai/steno-button.js` |
| `niro.js` | Niro product embed (always fullscreen) | `https://embed.steno.ai/niro.js` |

## Usage

Add a script tag to your page with `data-*` attributes for configuration:

```html
<script
  src="https://embed.steno.ai/steno-chat.js"
  data-id="your-chat-id"
  data-mode="default"
  data-position="right"
></script>
```

### Configuration attributes

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-id` | string | Chat/client identifier |
| `data-url` | URL | Custom chat URL (must be in the allowlist) |
| `data-mode` | `default` \| `panel` \| `fullscreen` | Widget display mode |
| `data-position` | `left` \| `right` \| `center` | Widget position |
| `data-backend` | string | Backend override |
| `data-language` | string | Language code |
| `data-z-index` | number | CSS z-index (default: `9999`) |
| `data-cookie-name` | string | Source cookie name for cross-domain cookie relay |
| `data-cookie-domain` | string | Target domain for the relayed cookie |

## How it works

```
Customer website                    Steno
┌─────────────────┐                ┌──────────────┐
│                  │    iframe      │              │
│  <script> tag  ─────creates────▶ │  chat.steno  │
│                  │               │     .ai       │
│  embed script    │◀──postMessage──│              │
│  (resize/nav)    │               │              │
└─────────────────┘                └──────────────┘
```

1. The embed script is loaded via `<script>` tag on the customer's website
2. It creates a fixed-position `<iframe>` pointing at the Steno chat app
3. The chat app inside the iframe communicates back via `postMessage` for:
   - **resize** — adjusting iframe dimensions when the chat opens/closes
   - **navigate** — opening links in the parent window (with protocol allowlist)
4. Origin validation ensures only allowed domains can send messages

## CI/CD workflow

The repo now supports two delivery tracks:

- **Cloudflare Pages previews** for testing minified assets on non-`main` branches
- **Legacy jsDelivr release publishing** from `main` for existing customers until the cutover is complete

### Cloudflare Pages deploys

`.github/workflows/cloudflare-pages.yml` is now the canonical delivery workflow:

- Push any non-`main` branch to get a Cloudflare Pages preview deployment.
- Push or merge to `main` to automatically publish the production Pages deployment.
- Use `workflow_dispatch` only when you want to trigger an explicit preview or production deploy from GitHub.

Required GitHub configuration:

- Repository variable: `CLOUDFLARE_PAGES_PROJECT`
- Repository secret: `CLOUDFLARE_ACCOUNT_ID`
- Repository secret: `CLOUDFLARE_API_TOKEN`

If the Pages project is Git-integrated, disable automatic production and preview branch builds in Cloudflare and let this workflow own deploys.

The deploy output includes:

- Root assets for stable URLs such as `/steno-chat.js`
- Optional versioned assets under `/v/<version>/...` when `BUILD_VERSION` is set
- A `_headers` file for Cloudflare cache policy

### Legacy jsDelivr publishing

Every push to `main` still builds and publishes the release branch, but now with minified files instead of obfuscated ones:

```
main (source)                          release (minified)
     │                                        │
     │  push                                  │
     ▼                                        │
 ┌──────────────────┐                         │
 │  GitHub Actions   │                         │
 │                   │                         │
 │  1. npm ci        │                         │
 │  2. minify JS     │──── force push ────────▶│
 │  3. tag (semver)  │                         │
 │  4. GH release    │                         │
 │  5. purge CDN     │                         │
 └──────────────────┘                         │
                                               │
                               jsDelivr @latest resolves
                               to newest tag on this branch
```

### Branches

- **`main`** — Source of truth. Human-readable JavaScript. All changes go here.
- **`release`** — Managed by CI only. Contains minified JS files at the root level for jsDelivr. Never edit directly.

### Versioning

Tags are auto-incremented (patch) from the latest semver tag (e.g. `3.2.6` → `3.2.7`). Never create tags manually.

### Minification

Uses [`esbuild`](https://esbuild.github.io/) to minify the public embed artifacts without adding obfuscation-specific runtime patterns.

### DRY_RUN mode

Set `DRY_RUN: "true"` in the workflow file to push to the `release` branch without tagging or releasing. Useful for testing — verify via `cdn.jsdelivr.net/gh/aisteno/embed@release/steno-chat.js` without affecting `@latest`.

### Branch protection

`main` requires a pull request to merge. Repository admins can bypass this for hotfixes.

## Local development

### Build minified assets locally

```bash
npm install
npm run build:minified
BUILD_VERSION=3.2.7 npm run build:minified
```

### Test the widget

Open `index.html` in a browser for a local smoke test, or serve `dist/` through a static server to test the Cloudflare-ready output.
