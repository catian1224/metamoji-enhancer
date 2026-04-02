"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");
const SRC_FILE = path.join(ROOT_DIR, "src", "main.js");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const USER_SCRIPT_FILE = path.join(
    DIST_DIR,
    "metamoji-mobile_userscript.user.js",
);
const BOOKMARKLET_FILE = path.join(
    DIST_DIR,
    "metamoji-mobile_bookmarklet.min.js",
);

const USER_SCRIPT_HEADER = [
    "// ==UserScript==",
    "// @name         MetaMoJi Mobile Userscript",
    "// @version      1.0.0",
    "// @description  Optimize MetaMoJi ClassRoom 3 for mobile devices.",
    "// @author       catian1224",
    "// @match        https://classroom.metamoji.com/cr/*",
    "// ==/UserScript==",
].join("\n");

function buildRuntime(sourceCode) {
    const body = sourceCode
        .trim()
        .split(/\r?\n/)
        .map((line) => (line.length > 0 ? `\t${line}` : line))
        .join("\n");

    return `(function () {\n\t"use strict";\n\n${body}\n})();\n`;
}

function toBookmarkletPayload(runtimeCode) {
    return runtimeCode
        .replace(/\r/g, "")
        .split("\n")
        .map((line) => line.trim())
        .join("");
}

function build() {
    const sourceCode = fs.readFileSync(SRC_FILE, "utf8");
    const runtimeCode = buildRuntime(sourceCode);
    const bookmarkletPayload = toBookmarkletPayload(runtimeCode);

    const userscript = `${USER_SCRIPT_HEADER}\n\n${runtimeCode}`;
    const bookmarklet = `javascript:${bookmarkletPayload}`;

    fs.mkdirSync(DIST_DIR, { recursive: true });
    fs.writeFileSync(USER_SCRIPT_FILE, userscript, "utf8");
    fs.writeFileSync(BOOKMARKLET_FILE, `${bookmarklet}\n`, "utf8");

    console.log("Build completed.");
    console.log(`- ${path.relative(ROOT_DIR, USER_SCRIPT_FILE)}`);
    console.log(`- ${path.relative(ROOT_DIR, BOOKMARKLET_FILE)}`);
}

try {
    build();
} catch (error) {
    console.error("Build failed.");
    console.error(error);
    process.exitCode = 1;
}
