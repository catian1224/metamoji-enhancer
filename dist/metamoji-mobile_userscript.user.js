// ==UserScript==
// @name         MetaMoJi Mobile Userscript
// @version      1.0.0
// @description  Optimize MetaMoJi ClassRoom 3 for mobile devices.
// @author       catian1224
// @match        https://classroom.metamoji.com/cr/*
// ==/UserScript==

(function () {
    "use strict";

    function applyViewportGuard() {
        const existingMeta = document.querySelector('meta[name="viewport"]');
        const viewportMeta = existingMeta || document.createElement("meta");
        if (!existingMeta) {
            viewportMeta.setAttribute("name", "viewport");
            (document.head || document.documentElement).appendChild(
                viewportMeta,
            );
        }
        viewportMeta.setAttribute(
            "content",
            "width=device-width, initial-scale=1, maximum-scale=1",
        );
    }
    applyViewportGuard();
    window.addEventListener("DOMContentLoaded", applyViewportGuard, {
        once: true,
    });
    window.addEventListener("pageshow", applyViewportGuard);
})();
