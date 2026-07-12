"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadTextTransform() {
    const source = fs.readFileSync(
        path.join(__dirname, "..", "..", "src", "core", "text-transform.js"),
        "utf8",
    );
    const context = vm.createContext({});
    vm.runInContext(
        `${source}\n;globalThis.__textTransform = ClassroomTextTransform;`,
        context,
    );
    return context.__textTransform;
}

const TextTransform = loadTextTransform();

test("converts supported characters to superscript", () => {
    assert.equal(TextTransform.transform("H2O n+1", "superscript"), "ᴴ²ᴼ ⁿ⁺¹");
});

test("converts supported characters to subscript", () => {
    assert.equal(TextTransform.transform("H2O x-1", "subscript"), "H₂O ₓ₋₁");
});

test("leaves unsupported characters unchanged", () => {
    assert.equal(TextTransform.transform("日本語!", "superscript"), "日本語!");
});

test("converts subscript directly to superscript", () => {
    assert.equal(TextTransform.transform("H₂O x₋₁", "superscript"), "ᴴ²ᴼ ˣ⁻¹");
});

test("converts superscript directly to subscript", () => {
    assert.equal(TextTransform.transform("ⁿ⁺¹", "subscript"), "ₙ₊₁");
});

test("pressing the active mode restores normal characters", () => {
    assert.equal(TextTransform.transform("ᴴ²ᴼ", "superscript"), "H2O");
    assert.equal(TextTransform.transform("ₓ₋₁", "subscript"), "x-1");
});

test("normalizes superscript and subscript characters for format clearing", () => {
    assert.equal(TextTransform.normalize("ᴴ₂O ⁿ₊₁"), "H2O n+1");
    assert.equal(TextTransform.normalize("日本語!"), "日本語!");
});

test("detects a uniform superscript or subscript selection", () => {
    assert.equal(TextTransform.getMode("ⁿ⁺¹"), "superscript");
    assert.equal(TextTransform.getMode("ₓ₋₁"), "subscript");
    assert.equal(TextTransform.getMode("H₂O"), "subscript");
});

test("treats unsupported characters as neutral when the whole selection is transformed", () => {
    assert.equal(TextTransform.getMode("ₐbcd₁₂₃"), "subscript");
    assert.equal(TextTransform.getMode("ᴬᴮCᴰ"), "superscript");
    assert.equal(TextTransform.transform("ₐbcd₁₂₃", "subscript"), "abcd123");
    assert.equal(TextTransform.transform("ᴬᴮCᴰ", "superscript"), "ABCD");
});

test("does not mark partially transformed supported characters as active", () => {
    assert.equal(TextTransform.getMode("a₁2"), null);
    assert.equal(TextTransform.getMode("ᴬB"), null);
});

test("exposes the character maps for regression checks", () => {
    assert.equal(TextTransform.characterMaps.superscript[2], "²");
    assert.equal(TextTransform.characterMaps.subscript[2], "₂");
});
