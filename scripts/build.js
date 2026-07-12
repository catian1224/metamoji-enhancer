"use strict";

const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const sourceFiles = [
    "src/features/mobile-viewport.js",
    "src/core/text-transform.js",
    "src/core/keyboard-shortcuts.js",
    "src/features/text-palette.js",
    "src/entrypoints/classroom.js",
].map((relativePath) => path.join(rootDir, relativePath));

const product = {
    description: "Enhance MetaMoJi ClassRoom 3",
    name: "Metamoji Enhancer",
    version: "2.0.0",
};

const outputs = {
    bookmarklet: path.join(
        rootDir,
        "dist",
        "bookmarklet",
        "metamoji-enhancer.min.js",
    ),
    chromeExtension: path.join(rootDir, "dist", "chrome-extension"),
    userscript: path.join(
        rootDir,
        "dist",
        "userscript",
        "metamoji-enhancer.user.js",
    ),
};

function readSources() {
    return sourceFiles
        .map((file) => fs.readFileSync(file, "utf8").trim())
        .join("\n\n");
}

function recreateDirectory(directory) {
    fs.rmSync(directory, { force: true, recursive: true });
    fs.mkdirSync(directory, { recursive: true });
}

function buildRuntime(sourceCode) {
    const body = sourceCode
        .split(/\r?\n/)
        .map((line) => (line.length > 0 ? `\t${line}` : line))
        .join("\n");
    return `(function () {\n\t"use strict";\n\n${body}\n})();\n`;
}

function buildUserscript(runtimeCode) {
    const header = [
        "// ==UserScript==",
        `// @name         ${product.name}`,
        `// @version      ${product.version}`,
        `// @description  ${product.description}`,
        "// @author       catian1224",
        "// @match        https://classroom.metamoji.com/cr/*",
        "// ==/UserScript==",
    ].join("\n");

    recreateDirectory(path.dirname(outputs.userscript));
    fs.writeFileSync(outputs.userscript, `${header}\n\n${runtimeCode}`, "utf8");
}

function buildBookmarklet(runtimeCode) {
    const payload = runtimeCode
        .replace(/\r/g, "")
        .split("\n")
        .map((line) => line.trim())
        .join("");

    recreateDirectory(path.dirname(outputs.bookmarklet));
    fs.writeFileSync(outputs.bookmarklet, `javascript:${payload}\n`, "utf8");
}

function buildChromeExtension(runtimeCode) {
    const manifestSource = path.join(rootDir, "extension", "manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestSource, "utf8"));
    manifest.name = product.name;
    manifest.version = product.version;
    manifest.description = product.description;

    recreateDirectory(outputs.chromeExtension);
    fs.writeFileSync(
        path.join(outputs.chromeExtension, "manifest.json"),
        `${JSON.stringify(manifest, null, 4)}\n`,
        "utf8",
    );
    fs.writeFileSync(
        path.join(outputs.chromeExtension, "content.js"),
        runtimeCode,
        "utf8",
    );
}

function build() {
    const runtimeCode = buildRuntime(readSources());
    const requestedTarget = process.argv[2] || "all";
    const builders = {
        bookmarklet: buildBookmarklet,
        extension: buildChromeExtension,
        userscript: buildUserscript,
    };

    if (requestedTarget === "all") {
        Object.values(builders).forEach((builder) => builder(runtimeCode));
    } else if (builders[requestedTarget]) {
        builders[requestedTarget](runtimeCode);
    } else {
        throw new Error(`Unknown build target: ${requestedTarget}`);
    }

    console.log(`Build completed: ${requestedTarget}.`);
}

try {
    build();
} catch (error) {
    console.error("Build failed.");
    console.error(error);
    process.exitCode = 1;
}
