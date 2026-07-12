# Chrome Extension

This directory contains the source manifest for Metamoji Enhancer.

Build only the extension with:

```sh
npm run build:extension
```

The loadable Manifest V3 extension is generated in `dist/chrome-extension`.
It contains:

- `manifest.json`: generated from `extension/manifest.json`
- `content.js`: the shared desktop/mobile runtime

No Chrome permissions are required beyond the declared ClassRoom 3 content
script match.
