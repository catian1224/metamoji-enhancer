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

function crc32(buffer) {
    let crc = 0xffffffff;
    for (const byte of buffer) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit += 1) {
            crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
        }
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function createZip(entries) {
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    for (const { name, data } of entries) {
        const nameBuffer = Buffer.from(name, "utf8");
        const checksum = crc32(data);
        const localHeader = Buffer.alloc(30 + nameBuffer.length);
        localHeader.writeUInt32LE(0x04034b50, 0);
        localHeader.writeUInt16LE(20, 4);
        localHeader.writeUInt16LE(0, 6);
        localHeader.writeUInt16LE(0, 8);
        localHeader.writeUInt16LE(0, 10);
        localHeader.writeUInt16LE(0, 12);
        localHeader.writeUInt32LE(checksum, 14);
        localHeader.writeUInt32LE(data.length, 18);
        localHeader.writeUInt32LE(data.length, 22);
        localHeader.writeUInt16LE(nameBuffer.length, 26);
        localHeader.writeUInt16LE(0, 28);
        nameBuffer.copy(localHeader, 30);
        localParts.push(localHeader, data);

        const centralHeader = Buffer.alloc(46 + nameBuffer.length);
        centralHeader.writeUInt32LE(0x02014b50, 0);
        centralHeader.writeUInt16LE(20, 4);
        centralHeader.writeUInt16LE(20, 6);
        centralHeader.writeUInt16LE(0, 8);
        centralHeader.writeUInt16LE(0, 10);
        centralHeader.writeUInt16LE(0, 12);
        centralHeader.writeUInt16LE(0, 14);
        centralHeader.writeUInt32LE(checksum, 16);
        centralHeader.writeUInt32LE(data.length, 20);
        centralHeader.writeUInt32LE(data.length, 24);
        centralHeader.writeUInt16LE(nameBuffer.length, 28);
        centralHeader.writeUInt16LE(0, 30);
        centralHeader.writeUInt16LE(0, 32);
        centralHeader.writeUInt16LE(0, 34);
        centralHeader.writeUInt16LE(0, 36);
        centralHeader.writeUInt32LE(0, 38);
        centralHeader.writeUInt32LE(offset, 42);
        nameBuffer.copy(centralHeader, 46);
        centralParts.push(centralHeader);

        offset += localHeader.length + data.length;
    }

    const centralDirectory = Buffer.concat(centralParts);
    const endRecord = Buffer.alloc(22);
    endRecord.writeUInt32LE(0x06054b50, 0);
    endRecord.writeUInt16LE(0, 4);
    endRecord.writeUInt16LE(0, 6);
    endRecord.writeUInt16LE(entries.length, 8);
    endRecord.writeUInt16LE(entries.length, 10);
    endRecord.writeUInt32LE(centralDirectory.length, 12);
    endRecord.writeUInt32LE(offset, 16);
    endRecord.writeUInt16LE(0, 20);

    return Buffer.concat([...localParts, centralDirectory, endRecord]);
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
    const extensionFiles = ["manifest.json", "content.js"].map((name) => ({
        name,
        data: fs.readFileSync(path.join(outputs.chromeExtension, name)),
    }));
    fs.writeFileSync(
        path.join(outputs.chromeExtension, "metamoji-enhancer-extension.zip"),
        createZip(extensionFiles),
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
