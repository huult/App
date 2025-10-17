import {useEffect} from 'react';
import {updateViewportMeta} from '@libs/ViewportMetaManager';

/**
 * Hook to manage viewport-fit=cover for specific components
 * Useful when you want to ensure viewport-fit=cover is applied
 * regardless of route-based detection
 */
function useViewportFit(shouldApply: boolean = true) {
    useEffect(() => {
        // Apply viewport-fit when component mounts
        updateViewportMeta(shouldApply);

        // Cleanup - remove viewport-fit when component unmounts
        return () => {
            if (shouldApply) {
                updateViewportMeta(false);
            }
        };
    }, [shouldApply]);
}

export default useViewportFit;
