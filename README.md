# Steno Embed Scripts

Standalone JavaScript embed scripts that add Steno chat widgets to customer websites via iframe. Served through jsDelivr CDN.

## Scripts

| Script | Purpose | CDN URL |
|--------|---------|---------|
| `steno-chat.js` | Primary chat widget (floating button, panel, or fullscreen) | `cdn.jsdelivr.net/gh/aisteno/embed@latest/steno-chat.js` |
| `steno-button.js` | Branded button that lazy-loads `steno-chat.js` on click | `cdn.jsdelivr.net/gh/aisteno/embed@latest/steno-button.js` |
| `niro.js` | Niro product embed (always fullscreen) | `cdn.jsdelivr.net/gh/aisteno/embed@latest/niro.js` |

## Usage

Add a script tag to your page with `data-*` attributes for configuration:

```html
<script
  src="https://cdn.jsdelivr.net/gh/aisteno/embed@latest/steno-chat.js"
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

Every push to `main` automatically builds and releases:

```
main (source)                          release (obfuscated)
     │                                        │
     │  push                                  │
     ▼                                        │
 ┌──────────────────┐                         │
 │  GitHub Actions   │                         │
 │                   │                         │
 │  1. npm ci        │                         │
 │  2. obfuscate JS  │──── force push ────────▶│
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
- **`release`** — Managed by CI only. Contains obfuscated JS files at the root level. Never edit directly.

### Versioning

Tags are auto-incremented (patch) from the latest semver tag (e.g. `3.2.6` → `3.2.7`). Never create tags manually.

### Obfuscation

Uses [`javascript-obfuscator`](https://github.com/nicolo-ribaudo/javascript-obfuscator) with:
- **Low-obfuscation preset** — keeps file size and runtime overhead small
- **RC4 string encoding** — encrypts all string literals (URLs, domains, config keys) so they're not readable in the output

### DRY_RUN mode

Set `DRY_RUN: "true"` in the workflow file to push to the `release` branch without tagging or releasing. Useful for testing — verify via `cdn.jsdelivr.net/gh/aisteno/embed@release/steno-chat.js` without affecting `@latest`.

### Branch protection

`main` requires a pull request to merge. Repository admins can bypass this for hotfixes.

## Local development

### Test obfuscation locally

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

### Test the widget

Open `index.html` in a browser, or point the script src to a local/dist file.
