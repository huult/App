/**
 * Utility to manage viewport meta tag dynamically based on routes (Web only)
 */

const ROUTES_REQUIRING_VIEWPORT_FIT = [
    // Add route names that need interactive-widget=resizes-visual
    'TRAVEL_DOT_LINK_WEB_VIEW',
    'REPORT_ATTACHMENTS',
    'Search_Root',
    'Search_Money_Request_Report',
    'Search_Report_RHP',
    'Search_Advanced_Filters_RHP',
    'Search_Saved_Search_Rename_RHP',
    // Add more routes as needed
];

/**
 * Updates the viewport meta tag to include or exclude interactive-widget=resizes-visual
 */
function updateViewportMeta(shouldIncludeViewportFit: boolean) {
    const viewportMeta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');

    console.log('****** viewportMeta ******', viewportMeta);

    if (!viewportMeta) {
        return;
    }

    const currentContent = viewportMeta.content;

    if (shouldIncludeViewportFit) {
        console.log('****** shouldIncludeViewportFit ******', shouldIncludeViewportFit);

        // Add interactive-widget=resizes-visual if not already present
        if (!currentContent.includes('interactive-widget=resizes-visual')) {
            viewportMeta.content = `${currentContent}, interactive-widget=resizes-visual`;

            console.log('****** viewportMeta ******', viewportMeta);
        }
    } else {
        // Remove interactive-widget=resizes-visual if present
        viewportMeta.content = currentContent
            .replace(/,\s*interactive-widget=resizes-visual/g, '')
            .replace(/interactive-widget=resizes-visual,?\s*/g, '')
            .replace(/,\s*$/, ''); // Clean up trailing comma
    }
}

/**
 * Check if current route requires interactive-widget=resizes-visual
 */
function shouldRouteUseViewportFit(routeName?: string): boolean {
    if (!routeName) {
        return false;
    }

    return ROUTES_REQUIRING_VIEWPORT_FIT.includes(routeName);
}

/**
 * Handle route change and update viewport meta accordingly
 */
function handleRouteChange(routeName?: string) {
    const shouldUseViewportFit = shouldRouteUseViewportFit(routeName);
    updateViewportMeta(shouldUseViewportFit);
}

export {updateViewportMeta, shouldRouteUseViewportFit, handleRouteChange, ROUTES_REQUIRING_VIEWPORT_FIT};
