# Metamoji Enhancer

Metamoji Enhancer extends [MetaMoJi ClassRoom 3](https://product.metamoji.com/classroom/)
with a few small text-editing improvements for desktop and mobile browsers.

## Features

- Supports superscript and subscript characters.
- [iOS] Disables automatic zooming when entering text.

Only selected text is changed. When a character has no corresponding Unicode
superscript or subscript form, it is left unchanged. The keyboard shortcuts do
nothing when the selection is collapsed.

## Installation

Metamoji Enhancer is available in three formats. All formats use the same
source code and provide the same text features.

### Chrome Extension

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select the `dist/chrome-extension` directory.

To rebuild the extension after changing the source, run:

```sh
npm run build:extension
```

### Userscript

The Userscript works in desktop browsers and iOS Safari.

#### iOS

1. Install a userscript extension such as [Userscripts](https://apps.apple.com/jp/app/userscripts/id1463298887).
2. Enable the extension in the Settings app or in Safari.
3. Download [`dist/userscript/metamoji-enhancer.user.js`](./dist/userscript/metamoji-enhancer.user.js)
   into the Userscripts directory.
4. Enable Metamoji Enhancer in the userscript extension.

#### Desktop

Install [`dist/userscript/metamoji-enhancer.user.js`](./dist/userscript/metamoji-enhancer.user.js)
with a userscript manager such as
[Tampermonkey](https://www.tampermonkey.net/) or
[Violentmonkey](https://violentmonkey.github.io/).

### Bookmarklet

The Bookmarklet works in any browser.

1. Copy the contents of [`dist/bookmarklet/metamoji-enhancer.min.js`](./dist/bookmarklet/metamoji-enhancer.min.js).
2. Create a new bookmark and paste the code into its URL field.
3. Open a MetaMoJi ClassRoom 3 page and run the bookmarklet.

Run the bookmarklet each time you access a new ClassRoom 3 page.

## Development

Install dependencies and run the test suite:

```sh
npm install
npm test
```

Build all distributions:

```sh
npm run build
```

The build writes the generated files to `dist/`:

```text
dist/
  bookmarklet/
  userscript/
  chrome-extension/
```

## Project structure

```text
src/
  core/          Shared transformation and shortcut logic
  features/      Text-palette and mobile-specific features
  entrypoints/   Runtime composition and platform detection
extension/       Chrome Extension manifest source
scripts/         Build tooling
test/            Automated tests
dist/            Generated Bookmarklet, Userscript, and Extension files
```

## License

See [LICENSE](./LICENSE).
