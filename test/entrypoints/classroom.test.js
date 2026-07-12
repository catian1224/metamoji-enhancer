"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(
    path.join(__dirname, "..", "..", "src", "entrypoints", "classroom.js"),
    "utf8",
);

function runEntrypoint(navigator) {
    const calls = { mobileViewport: 0, textPalette: 0 };
    vm.runInNewContext(source, {
        installMobileViewportGuard() {
            calls.mobileViewport += 1;
        },
        installTextPaletteFeature() {
            calls.textPalette += 1;
        },
        navigator,
    });
    return calls;
}

test("installs shared features without mobile behavior on desktop", () => {
    assert.deepEqual(
        runEntrypoint({
            maxTouchPoints: 0,
            platform: "Win32",
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        }),
        { mobileViewport: 0, textPalette: 1 },
    );
});

test("installs mobile behavior on iOS and Android", () => {
    assert.deepEqual(
        runEntrypoint({
            maxTouchPoints: 5,
            platform: "iPhone",
            userAgent: "Mozilla/5.0 (iPhone)",
        }),
        { mobileViewport: 1, textPalette: 1 },
    );
    assert.deepEqual(
        runEntrypoint({
            maxTouchPoints: 5,
            platform: "Linux armv8l",
            userAgent: "Mozilla/5.0 (Linux; Android 15)",
        }),
        { mobileViewport: 1, textPalette: 1 },
    );
});

test("recognizes iPadOS desktop user agents", () => {
    assert.deepEqual(
        runEntrypoint({
            maxTouchPoints: 5,
            platform: "MacIntel",
            userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X)",
        }),
        { mobileViewport: 1, textPalette: 1 },
    );
});
