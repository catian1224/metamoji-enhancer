"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const textTransformSource = fs.readFileSync(
    path.join(__dirname, "..", "..", "src", "core", "text-transform.js"),
    "utf8",
);
const textPaletteSource = fs.readFileSync(
    path.join(__dirname, "..", "..", "src", "features", "text-palette.js"),
    "utf8",
);

test("the existing clear-format button removes native and script formatting", () => {
    const classes = new Set(["disabled"]);
    const buttonListeners = {};
    const documentListeners = {};
    const clearFormatButton = {
        classList: {
            toggle(name, force) {
                if (force) {
                    classes.add(name);
                } else {
                    classes.delete(name);
                }
            },
        },
        dataset: {},
        addEventListener(type, listener) {
            buttonListeners[type] = listener;
        },
    };
    const editor = {
        bold: true,
        childNodes: [],
        focus() {},
        isConnected: true,
        textContent: "H₂O",
    };
    function createTextNode(value) {
        return {
            childNodes: [],
            nodeType: 3,
            nodeValue: value,
            parentElement: {
                closest() {
                    return editor;
                },
            },
        };
    }
    let textNode = createTextNode("H₂O");
    editor.childNodes = [textNode];
    const range = {
        collapsed: false,
        endContainer: textNode,
        endOffset: 3,
        startContainer: textNode,
        startOffset: 0,
        cloneRange() {
            return this;
        },
        toString() {
            return "H₂O";
        },
    };
    const selection = {
        isCollapsed: false,
        rangeCount: 1,
        addRange() {},
        getRangeAt() {
            return range;
        },
        removeAllRanges() {},
    };
    let scheduledInstall;
    const executedCommands = [];
    const context = vm.createContext({
        ClassroomKeyboardShortcuts: { getTextTransformMode: () => null },
        Event,
        Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 },
        queueMicrotask(callback) {
            callback();
        },
        MutationObserver: class {
            observe() {}
        },
        document: {
            createRange() {
                let startContainer = editor;
                let startOffset = 0;
                let endContainer = editor;
                let endOffset = editor.childNodes.length;
                return {
                    get endContainer() {
                        return endContainer;
                    },
                    get startContainer() {
                        return startContainer;
                    },
                    cloneRange() {
                        return this;
                    },
                    selectNodeContents() {
                        startContainer = editor;
                        startOffset = 0;
                        endContainer = editor;
                        endOffset = editor.childNodes.length;
                    },
                    setEnd(node, offset) {
                        endContainer = node;
                        endOffset = offset;
                    },
                    setStart(node, offset) {
                        startContainer = node;
                        startOffset = offset;
                    },
                    toString() {
                        const value = editor.childNodes[0]?.nodeValue || "";
                        const start =
                            startContainer === editor ? 0 : startOffset;
                        const end =
                            endContainer === editor ? value.length : endOffset;
                        return value.slice(start, end);
                    },
                };
            },
            documentElement: {},
            execCommand(command, _showUi, text) {
                executedCommands.push({ command, text });
                if (command === "removeFormat") {
                    editor.bold = false;
                    textNode = createTextNode(editor.textContent);
                    editor.childNodes = [textNode];
                } else if (command === "insertText") {
                    editor.textContent = text;
                    editor.childNodes[0].nodeValue = text;
                }
                return true;
            },
            getElementById() {
                return {};
            },
            querySelector(selector) {
                return selector === '[data-test-id="FXUIID_TEXT_STYLE_CLEAR"]'
                    ? clearFormatButton
                    : null;
            },
            querySelectorAll() {
                return [];
            },
            addEventListener(type, listener) {
                documentListeners[type] = listener;
            },
        },
        window: {
            getSelection() {
                return selection;
            },
            requestAnimationFrame(callback) {
                scheduledInstall = callback;
            },
        },
    });

    vm.runInContext(
        `${textTransformSource}\n${textPaletteSource}\ninstallTextPaletteFeature();`,
        context,
    );
    scheduledInstall();
    documentListeners.selectionchange();

    assert.equal(typeof buttonListeners.click, "function");
    assert.equal(
        classes.has("metamoji-enhancer-clear-format-script-active"),
        true,
    );

    buttonListeners.click();

    assert.deepEqual(executedCommands, [
        { command: "removeFormat", text: undefined },
        { command: "insertText", text: "H2O" },
    ]);
    assert.equal(editor.bold, false);
    assert.equal(editor.textContent, "H2O");
    assert.equal(
        classes.has("metamoji-enhancer-clear-format-script-active"),
        false,
    );
});
