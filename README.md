# Steno Embed Scripts

Standalone JavaScript embed scripts that add Steno chat widgets to customer websites via iframe. This README documents `steno-chat.js`, the primary website embed that injects an iframe pointing at `chat.steno.ai`.

## Primary Embed Script

Use `steno-chat.js` to embed the Steno chat app on a website:

```html
<script
  src="https://embed.steno.ai/steno-chat.js"
  data-id="your-chat-id"
  data-mode="default"
  data-position="right"
></script>
```

## Usage

### Floating widget

```html
<script
  src="https://embed.steno.ai/steno-chat.js"
  data-id="your-chat-id"
  data-mode="default"
  data-position="right"
></script>
```

### Existing container embed

Use `data-container` when the chat should fill an existing element on the page instead of floating over the page.

```html
<div id="steno-chat-slot" style="width: 100%; height: 700px;"></div>

<script
  src="https://embed.steno.ai/steno-chat.js"
  data-id="your-chat-id"
  data-container="#steno-chat-slot"
></script>
```

Container mode behavior:

- Mounts the iframe inside the matched element instead of `document.body`
- Fills the container at `width: 100%` and `height: 100%`
- Opens the full chat immediately
- Ignores floating positioning attributes such as `data-position`

### Configuration attributes

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-id` | string | Chat/client identifier |
| `data-container` | CSS selector | Mount into an existing element instead of creating a floating widget |
| `data-url` | URL | Custom chat URL (must be in the allowlist) |
| `data-mode` | `default` \| `panel` \| `fullscreen` | Widget display mode |
| `data-position` | `left` \| `right` \| `center` | Widget position |
| `data-backend` | string | Backend override |
| `data-language` | string | Language code |
| `data-z-index` | number | CSS z-index (default: `9999`) |
| `data-border-width` | CSS px value | Optional launcher border width, e.g. `2px` |
| `data-border-color` | CSS color | Optional launcher border color, e.g. `#177881` |
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
2. It creates an `<iframe>` pointing at the Steno chat app
3. It either:
   - appends the iframe to `document.body` for floating widget mode, or
   - mounts the iframe into the element matched by `data-container`
4. The chat app inside the iframe communicates back via `postMessage` for:
   - **resize** — adjusting iframe dimensions when the chat opens/closes
   - **navigate** — opening links in the parent window (with protocol allowlist)
5. In container mode, the host element owns sizing and resize messages are ignored
6. Origin validation ensures only allowed domains can send messages

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

If `npm run build:minified` fails after switching between Rosetta and native Node on macOS, rerun `npm install` to refresh the platform-specific `esbuild` binary.

### Test the widget

Serve the repo over HTTP for a local smoke test:

```bash
python3 -m http.server 8123
```

Then open [http://127.0.0.1:8123/index.html](http://127.0.0.1:8123/index.html).

Do not test via `file://.../index.html`; iframe/embed behavior can differ from a real website context.
