function installTextPaletteFeature() {
    const buttonClass = "metamoji-enhancer-text-transform-button";
    const clearFormatActiveClass =
        "metamoji-enhancer-clear-format-script-active";
    const paletteClass = "metamoji-enhancer-expanded-text-palette";
    const styleId = "metamoji-enhancer-text-transform-style";

    let savedRange = null;
    let savedEditor = null;
    let installScheduled = false;

    function isVisible(element) {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    }

    function findEditor(node) {
        if (!node) {
            return null;
        }
        const element =
            node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
        return element?.closest('[contenteditable="true"]') || null;
    }

    function getRangeStateText(range) {
        return range.collapsed ? "" : range.toString();
    }

    function clearSavedSelection() {
        savedRange = null;
        savedEditor = null;
    }

    function getSelectionContext(selection) {
        if (!selection || selection.rangeCount !== 1) {
            return null;
        }

        const range = selection.getRangeAt(0);
        const startEditor = findEditor(range.startContainer);
        const endEditor = findEditor(range.endContainer);
        if (!startEditor || startEditor !== endEditor) {
            return null;
        }

        return { editor: startEditor, range };
    }

    function getRangeBookmark(editor, range) {
        try {
            const startProbe = document.createRange();
            startProbe.selectNodeContents(editor);
            startProbe.setEnd(range.startContainer, range.startOffset);

            const endProbe = document.createRange();
            endProbe.selectNodeContents(editor);
            endProbe.setEnd(range.endContainer, range.endOffset);
            return {
                start: startProbe.toString().length,
                end: endProbe.toString().length,
            };
        } catch {
            return null;
        }
    }

    function findTextBoundary(root, targetOffset) {
        let remaining = targetOffset;
        let lastBoundary = { node: root, offset: 0 };

        function visit(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                const length = node.nodeValue?.length || 0;
                lastBoundary = { node, offset: length };
                if (remaining <= length) {
                    return { node, offset: remaining };
                }
                remaining -= length;
                return null;
            }

            for (const child of node.childNodes || []) {
                const boundary = visit(child);
                if (boundary) {
                    return boundary;
                }
            }
            return null;
        }

        return visit(root) || lastBoundary;
    }

    function restoreRangeBookmark(editor, bookmark) {
        if (!editor?.isConnected || !bookmark) {
            return null;
        }

        const textLength = editor.textContent?.length || 0;
        const start = findTextBoundary(
            editor,
            Math.min(bookmark.start, textLength),
        );
        const end = findTextBoundary(
            editor,
            Math.min(bookmark.end, textLength),
        );
        try {
            const range = document.createRange();
            range.setStart(start.node, start.offset);
            range.setEnd(end.node, end.offset);
            return range;
        } catch {
            return null;
        }
    }

    function updateButtonState(text) {
        const activeMode = ClassroomTextTransform.getMode(text);
        document.querySelectorAll(`.${buttonClass}`).forEach((button) => {
            button.classList.toggle(
                "active",
                button.dataset.textTransformMode === activeMode,
            );
        });

        const clearFormatButton = document.querySelector(
            '[data-test-id="FXUIID_TEXT_STYLE_CLEAR"]',
        );
        clearFormatButton?.classList.toggle(
            clearFormatActiveClass,
            ClassroomTextTransform.normalize(text) !== text,
        );
    }

    function rememberSelection() {
        const selection = window.getSelection();
        const context = getSelectionContext(selection);
        if (!context) {
            clearSavedSelection();
            updateButtonState("");
            return;
        }

        const { editor, range } = context;
        updateButtonState(getRangeStateText(range));
        if (selection.isCollapsed) {
            clearSavedSelection();
            return;
        }

        savedRange = range.cloneRange();
        savedEditor = editor;
    }

    function dispatchEditorInput(editor, text) {
        const inputEvent =
            typeof InputEvent === "function"
                ? new InputEvent("input", {
                      bubbles: true,
                      data: text,
                      inputType: "insertText",
                  })
                : new Event("input", { bubbles: true });
        editor.dispatchEvent(inputEvent);
    }

    function replaceRangeFallback(selection, range, editor, text) {
        range.deleteContents();
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        dispatchEditorInput(editor, text);
    }

    function replaceSavedSelection(transformText) {
        const selection = window.getSelection();
        const range = savedRange;
        const editor = savedEditor;
        if (
            !selection ||
            !range ||
            !editor?.isConnected ||
            findEditor(range.startContainer) !== editor ||
            findEditor(range.endContainer) !== editor
        ) {
            clearSavedSelection();
            return;
        }

        const originalText = range.toString();
        const transformedText = transformText(originalText);
        if (!originalText || transformedText === originalText) {
            return;
        }

        const editorTextBefore = editor.textContent;
        editor.focus({ preventScroll: true });
        selection.removeAllRanges();
        selection.addRange(range);

        let insertedByEditor = false;
        try {
            insertedByEditor = document.execCommand(
                "insertText",
                false,
                transformedText,
            );
        } catch {
            insertedByEditor = false;
        }
        if (insertedByEditor && editor.textContent === editorTextBefore) {
            insertedByEditor = false;
        }
        if (!insertedByEditor) {
            replaceRangeFallback(
                selection,
                range,
                editor,
                transformedText,
            );
        }

        clearSavedSelection();
        updateButtonState(transformedText);
    }

    function replaceSelection(targetMode) {
        replaceSavedSelection((text) =>
            ClassroomTextTransform.transform(text, targetMode),
        );
    }

    function clearSavedNativeFormatting() {
        const selection = window.getSelection();
        const range = savedRange;
        const editor = savedEditor;
        if (
            !selection ||
            !range ||
            !editor?.isConnected ||
            findEditor(range.startContainer) !== editor ||
            findEditor(range.endContainer) !== editor
        ) {
            return null;
        }

        const bookmark = getRangeBookmark(editor, range);
        if (!bookmark) {
            return null;
        }
        editor.focus({ preventScroll: true });
        selection.removeAllRanges();
        selection.addRange(range);
        try {
            document.execCommand("removeFormat", false);
        } catch {
            /* The app's own handler can still clear its styles. */
        }
        return { bookmark, editor };
    }

    function installClearFormatIntegration() {
        const button = document.querySelector(
            '[data-test-id="FXUIID_TEXT_STYLE_CLEAR"]',
        );
        if (!button || button.dataset.metamojiEnhancerClearFormat) {
            return;
        }

        button.dataset.metamojiEnhancerClearFormat = "true";
        const selectedText = savedRange?.toString() || "";
        button.classList.toggle(
            clearFormatActiveClass,
            ClassroomTextTransform.normalize(selectedText) !== selectedText,
        );
        button.addEventListener("click", () => {
            const selectedText = savedRange?.toString() || "";
            if (
                ClassroomTextTransform.normalize(selectedText) ===
                selectedText
            ) {
                return;
            }

            const clearOperation = clearSavedNativeFormatting();
            if (!clearOperation) {
                return;
            }
            queueMicrotask(() => {
                const restoredRange = restoreRangeBookmark(
                    clearOperation.editor,
                    clearOperation.bookmark,
                );
                if (!restoredRange) {
                    return;
                }
                savedRange = restoredRange;
                savedEditor = clearOperation.editor;
                replaceSavedSelection(() =>
                    ClassroomTextTransform.normalize(selectedText),
                );
            });
        });
    }

    function handleKeyboardShortcut(event) {
        const mode = ClassroomKeyboardShortcuts.getTextTransformMode(event);
        if (!mode) {
            return;
        }

        const selection = window.getSelection();
        const context = getSelectionContext(selection);
        if (!context || selection.isCollapsed) {
            return;
        }

        const { editor, range } = context;
        savedRange = range.cloneRange();
        savedEditor = editor;
        event.preventDefault();
        event.stopPropagation();
        replaceSelection(mode);
    }

    function addStyles() {
        if (document.getElementById(styleId)) {
            return;
        }
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
            .style-palette.${paletteClass} {
                max-width: none !important;
                width: max-content !important;
            }

            [data-test-id="FXUIID_TEXT_STYLE_CLEAR"].${clearFormatActiveClass} {
                cursor: pointer !important;
                opacity: 1 !important;
            }
        `;
        (document.head || document.documentElement).appendChild(style);
    }

    function findStyleButtonGroup() {
        const groups = Array.from(document.querySelectorAll(".button-group"));
        for (const container of groups) {
            const styleButtons = Array.from(
                container.querySelectorAll("button.font-style-btn"),
            ).filter(isVisible);
            if (styleButtons.length === 3) {
                return {
                    container,
                    insertionPoint: styleButtons[2],
                    template: styleButtons[0],
                };
            }
        }
        return null;
    }

    function createIcon(mode) {
        const scriptY = mode === "superscript" ? 21 : 47;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><g fill="#000" font-family="Arial,sans-serif" font-weight="600"><text x="13" y="40" font-size="27">X</text><text x="35" y="${scriptY}" font-size="17">2</text></g></svg>`;
        return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    }

    function createButton(template, title, mode) {
        const button = template.cloneNode(true);
        button.type = "button";
        button.setAttribute("aria-label", title);
        button.setAttribute("data-tooltip", title);
        button.removeAttribute("title");
        button.dataset.textTransformMode = mode;
        button.classList.add(buttonClass);
        button.classList.remove("active", "selected");
        button.removeAttribute("aria-pressed");
        button.removeAttribute("disabled");

        const icon = button.querySelector("img");
        if (icon) {
            icon.src = createIcon(mode);
            icon.alt = "";
        }

        button.addEventListener("pointerdown", (event) => {
            event.preventDefault();
            event.stopPropagation();
        });
        button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            replaceSelection(mode);
        });
        return button;
    }

    function installControls() {
        addStyles();
        installClearFormatIntegration();
        const group = findStyleButtonGroup();
        if (!group || group.container.querySelector(`.${buttonClass}`)) {
            return;
        }

        group.container
            .closest(".style-palette")
            ?.classList.add(paletteClass);
        group.insertionPoint.after(
            createButton(group.template, "上付き文字", "superscript"),
            createButton(group.template, "下付き文字", "subscript"),
        );

        const selection = window.getSelection();
        if (selection?.rangeCount) {
            updateButtonState(getRangeStateText(selection.getRangeAt(0)));
        }
    }

    function scheduleControlsInstall() {
        if (installScheduled) {
            return;
        }
        installScheduled = true;
        window.requestAnimationFrame(() => {
            installScheduled = false;
            installControls();
        });
    }

    document.addEventListener("selectionchange", rememberSelection);
    document.addEventListener("keydown", handleKeyboardShortcut, true);
    new MutationObserver(scheduleControlsInstall).observe(
        document.documentElement,
        { childList: true, subtree: true },
    );
    scheduleControlsInstall();
}
