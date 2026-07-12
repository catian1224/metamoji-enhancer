"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(
    path.join(__dirname, "..", "..", "src", "core", "keyboard-shortcuts.js"),
    "utf8",
);
const context = vm.createContext({});
vm.runInContext(
    `${source}\n;globalThis.__shortcuts = ClassroomKeyboardShortcuts;`,
    context,
);
const Shortcuts = context.__shortcuts;

function keyboardEvent(overrides) {
    return {
        altKey: false,
        code: "",
        ctrlKey: true,
        key: "",
        metaKey: false,
        repeat: false,
        shiftKey: true,
        ...overrides,
    };
}

test("maps Ctrl+Shift+Plus to superscript", () => {
    assert.equal(
        Shortcuts.getTextTransformMode(keyboardEvent({ key: "+" })),
        "superscript",
    );
    assert.equal(
        Shortcuts.getTextTransformMode(
            keyboardEvent({ code: "Equal", key: "=" }),
        ),
        "superscript",
    );
});

test("maps Ctrl+Shift+Minus to subscript", () => {
    assert.equal(
        Shortcuts.getTextTransformMode(keyboardEvent({ key: "-" })),
        "subscript",
    );
    assert.equal(
        Shortcuts.getTextTransformMode(
            keyboardEvent({ code: "Minus", key: "_" }),
        ),
        "subscript",
    );
});

test("ignores incomplete or modified shortcut combinations", () => {
    assert.equal(
        Shortcuts.getTextTransformMode(
            keyboardEvent({ ctrlKey: false, key: "+" }),
        ),
        null,
    );
    assert.equal(
        Shortcuts.getTextTransformMode(
            keyboardEvent({ altKey: true, key: "+" }),
        ),
        null,
    );
    assert.equal(
        Shortcuts.getTextTransformMode(
            keyboardEvent({ key: "+", repeat: true }),
        ),
        null,
    );
});
