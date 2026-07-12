function isMobileEnvironment() {
    const userAgent = navigator.userAgent || "";
    const isMobileUserAgent = /Android|iPad|iPhone|iPod/i.test(userAgent);
    const isTouchMac =
        navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    return isMobileUserAgent || isTouchMac;
}

if (isMobileEnvironment()) {
    installMobileViewportGuard();
}
installTextPaletteFeature();
