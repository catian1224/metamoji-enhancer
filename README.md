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

Download the latest release from the
[GitHub Releases page](https://github.com/catian1224/metamoji-enhancer/releases/latest).
The release includes a Bookmarklet, a Userscript, and a Chrome Extension ZIP.

### Chrome Extension

1. Download the Chrome Extension ZIP from the latest release.
2. Extract the ZIP file.
3. Open `chrome://extensions` in Chrome.
4. Turn on **Developer mode**.
5. Click **Load unpacked** and select the extracted directory.

### Userscript

The Userscript works in desktop browsers and iOS Safari.

#### iOS

1. Install a userscript extension such as [Userscripts](https://apps.apple.com/jp/app/userscripts/id1463298887).
2. Enable the extension in the Settings app or in Safari.
3. Download `metamoji-enhancer.user.js` from the latest release into the
   Userscripts directory.
4. Enable Metamoji Enhancer in the userscript extension.

#### Desktop

Download `metamoji-enhancer.user.js` from the latest release and install it
with a userscript manager such as
[Tampermonkey](https://www.tampermonkey.net/) or
[Violentmonkey](https://violentmonkey.github.io/).

### Bookmarklet

The Bookmarklet works in any browser.

1. Copy the contents of `metamoji-enhancer.min.js` from the latest release.
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
