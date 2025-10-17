/**
 * Native version - no-op since viewport meta tags don't apply to native apps
 */

function updateViewportMeta() {
    // No-op for native
}

function shouldRouteUseViewportFit(): boolean {
    return false;
}

function handleRouteChange() {
    // No-op for native
}

const ROUTES_REQUIRING_VIEWPORT_FIT: string[] = [];

export {updateViewportMeta, shouldRouteUseViewportFit, handleRouteChange, ROUTES_REQUIRING_VIEWPORT_FIT};
