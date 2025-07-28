import type {ParamListBase} from '@react-navigation/native';
import React, {createContext, useCallback, useEffect, useMemo, useRef} from 'react';
import useOnyx from '@hooks/useOnyx';
import usePrevious from '@hooks/usePrevious';
import {isSidebarScreenName} from '@libs/Navigation/helpers/isNavigatorName';
import type {PlatformStackRouteProp} from '@libs/Navigation/PlatformStackNavigation/types';
import type {NavigationPartialRoute, State} from '@libs/Navigation/types';
import ONYXKEYS from '@src/ONYXKEYS';
import SCREENS from '@src/SCREENS';

type ScrollOffsetContextValue = {
    /** Save scroll offset of FlashList on given screen */
    saveScrollOffset: (route: PlatformStackRouteProp<ParamListBase>, scrollOffset: number) => void;

    /** Get scroll offset value for given screen */
    getScrollOffset: (route: PlatformStackRouteProp<ParamListBase>) => number | undefined;

    /** Save scroll index of FlashList on given screen */
    saveScrollIndex: (route: PlatformStackRouteProp<ParamListBase>, scrollIndex: number) => void;

    /** Get scroll index value for given screen */
    getScrollIndex: (route: PlatformStackRouteProp<ParamListBase>) => number | undefined;

    /** Clean scroll offsets of screen that aren't anymore in the state */
    cleanStaleScrollOffsets: (state: State) => void;
};

type ScrollOffsetContextProviderProps = {
    /** Actual content wrapped by this component */
    children: React.ReactNode;
};

const defaultValue: ScrollOffsetContextValue = {
    saveScrollOffset: () => {},
    getScrollOffset: () => undefined,
    saveScrollIndex: () => {},
    getScrollIndex: () => undefined,
    cleanStaleScrollOffsets: () => {},
};

const ScrollOffsetContext = createContext<ScrollOffsetContextValue>(defaultValue);

/** This function is prepared to work with HOME and SEARCH screens. */
function getKey(route: PlatformStackRouteProp<ParamListBase> | NavigationPartialRoute): string {
    // Handle SEARCH screens with query parameters
    if (route.name === 'Search_Root' && route.params && 'q' in route.params && typeof route.params.q === 'string') {
        // Encode the query to handle spaces and special characters
        const encodedQuery = encodeURIComponent(route.params.q);
        return `${route.name}-${encodedQuery}`;
    }

    // Handle HOME screens with policyID
    if (route.params && 'policyID' in route.params && typeof route.params.policyID === 'string') {
        return `${route.name}-${route.params.policyID}`;
    }

    return `${route.name}-global`;
}

function ScrollOffsetContextProvider({children}: ScrollOffsetContextProviderProps) {
    const [priorityMode] = useOnyx(ONYXKEYS.NVP_PRIORITY_MODE, {canBeMissing: true});
    const scrollOffsetsRef = useRef<Record<string, number>>({});
    const scrollIndicesRef = useRef<Record<string, number>>({});
    const previousPriorityMode = usePrevious(priorityMode);

    useEffect(() => {
        if (previousPriorityMode === null || previousPriorityMode === priorityMode) {
            return;
        }

        // If the priority mode changes, we need to clear the scroll offsets for the home and search screens because it affects the size of the elements and scroll positions wouldn't be correct.
        for (const key of Object.keys(scrollOffsetsRef.current)) {
            if (key.includes(SCREENS.HOME) || key.includes(SCREENS.SEARCH.ROOT)) {
                delete scrollOffsetsRef.current[key];
            }
        }
        for (const key of Object.keys(scrollIndicesRef.current)) {
            if (key.includes(SCREENS.HOME) || key.includes(SCREENS.SEARCH.ROOT)) {
                delete scrollIndicesRef.current[key];
            }
        }
    }, [priorityMode, previousPriorityMode]);

    const saveScrollOffset: ScrollOffsetContextValue['saveScrollOffset'] = useCallback((route, scrollOffset) => {
        scrollOffsetsRef.current[getKey(route)] = scrollOffset;
    }, []);

    const getScrollOffset: ScrollOffsetContextValue['getScrollOffset'] = useCallback((route) => {
        if (!scrollOffsetsRef.current) {
            return;
        }
        const value = scrollOffsetsRef.current[getKey(route)];

        return value;
    }, []);

    const cleanStaleScrollOffsets: ScrollOffsetContextValue['cleanStaleScrollOffsets'] = useCallback((state) => {
        const sidebarRoutes = state.routes.filter((route) => isSidebarScreenName(route.name));
        const searchRoutes = state.routes.filter((route) => route.name === SCREENS.SEARCH.ROOT);

        const allRelevantRoutes = [...sidebarRoutes, ...searchRoutes];
        const scrollOffsetKeysOfExistingScreens = allRelevantRoutes.map((route) => getKey(route));

        // Be more conservative - only clean up keys that don't match sidebar screens
        // Don't clean up search routes since they might be temporarily not in the navigation state
        for (const key of Object.keys(scrollOffsetsRef.current)) {
            // Only clean up if it's not a search route and not in existing screens
            const isSearchRoute = key.startsWith('Search_Root-');
            if (!isSearchRoute && !scrollOffsetKeysOfExistingScreens.includes(key)) {
                delete scrollOffsetsRef.current[key];
            }
        }

        // Same for scroll indices
        for (const key of Object.keys(scrollIndicesRef.current)) {
            const isSearchRoute = key.startsWith('Search_Root-');
            if (!isSearchRoute && !scrollOffsetKeysOfExistingScreens.includes(key)) {
                delete scrollIndicesRef.current[key];
            }
        }
    }, []);

    const saveScrollIndex: ScrollOffsetContextValue['saveScrollIndex'] = useCallback((route, scrollIndex) => {
        scrollIndicesRef.current[getKey(route)] = scrollIndex;
    }, []);

    const getScrollIndex: ScrollOffsetContextValue['getScrollIndex'] = useCallback((route) => {
        if (!scrollIndicesRef.current) {
            return;
        }
        return scrollIndicesRef.current[getKey(route)];
    }, []);

    const contextValue = useMemo(
        (): ScrollOffsetContextValue => ({
            saveScrollOffset,
            getScrollOffset,
            cleanStaleScrollOffsets,
            saveScrollIndex,
            getScrollIndex,
        }),
        [saveScrollOffset, getScrollOffset, cleanStaleScrollOffsets, saveScrollIndex, getScrollIndex],
    );

    return <ScrollOffsetContext.Provider value={contextValue}>{children}</ScrollOffsetContext.Provider>;
}

export default ScrollOffsetContextProvider;

export {ScrollOffsetContext};
