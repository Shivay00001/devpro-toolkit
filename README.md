# DevPro Toolkit

A Manifest V3 Chrome extension: an all-in-one developer productivity toolkit.

## What it actually does

- **Tab Manager** (`modules/tab-manager.js`) — group/organize tabs from the popup.
- **Dark Mode** (`modules/dark-mode.js`, `content/dark-mode.css`, `content/content.js`) — force dark styling on pages via injected CSS.
- **Focus Mode** (`modules/focus-mode.js`) — blocklist of distracting URLs; the service worker redirects blocked tabs to `blocked/blocked.html`.
- **JSON Viewer** (`modules/json-viewer.js`) — pretty-print/format JSON from the popup.
- **REST Client** (`modules/rest-client.js`) — simple request builder in the popup.
- **Security Tools** (`modules/security.js`) — client-side helpers (e.g. header inspection).
- **Premium gate** (`modules/premium.js`) — usage tracking + upgrade modal; client-side only, no real payment backend.

Settings persist with `chrome.storage` (`lib/storage.js`); an options page lives at `options/options.html`.

## Install (unpacked, developer mode)

1. Open `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select this folder.
3. The ⚡ icon opens the popup.

## Package a zip (for Chrome Web Store or sideloading)

```bash
./package.sh      # creates devpro-toolkit.zip
```

Or manually: `zip -r devpro-toolkit.zip manifest.json icons background content lib modules options popup blocked -x '*.git*'`.

## Status & limits

- Manifest V3, JSON valid, all referenced files present, all JS files pass `node --check`.
- The `premium` module is a client-side placeholder — there is no payment backend; the "upgrade" flow is cosmetic.
- The extension requests `<all_urls>` host permission (needed for dark-mode injection and the REST client). In a published build this should be narrowed or the affected features moved behind `activeTab`.
- Not published to the Chrome Web Store; loaded unpacked only.
