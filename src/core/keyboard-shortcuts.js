const ClassroomKeyboardShortcuts = (() => {
    function getTextTransformMode(event) {
        if (
            !event.ctrlKey ||
            !event.shiftKey ||
            event.altKey ||
            event.metaKey ||
            event.repeat
        ) {
            return null;
        }

        if (
            event.key === "+" ||
            event.code === "Equal" ||
            event.code === "NumpadAdd"
        ) {
            return "superscript";
        }
        if (
            event.key === "-" ||
            event.key === "_" ||
            event.code === "Minus" ||
            event.code === "NumpadSubtract"
        ) {
            return "subscript";
        }
        return null;
    }

    return Object.freeze({ getTextTransformMode });
})();
