import React, {createContext, useContext} from 'react';

type ReportActionsListHelpers = {
    getOffsetByIndex: (index: number) => number | null;
    scrollToIndex: (index: number, additionalOffset?: number) => void;
    getCurrentScrollInfo: () => {
        currentOffset: number;
        nearestIndex: number;
        totalItems: number;
        layouts: {[key: number]: {offset: number; length: number}};
    };
    getCurrentOffset: () => number;
    getItemLayouts: () => {[key: number]: {offset: number; length: number}};
    getTotalItems: () => number;
};

const ReportActionsListContext = createContext<ReportActionsListHelpers | null>(null);

export const useReportActionsListHelpers = () => {
    const context = useContext(ReportActionsListContext);
    if (!context) {
        console.warn('useReportActionsListHelpers must be used within a ReportActionsListProvider');
        return null;
    }

    // Additional check to ensure functions are available
    if (!context.getOffsetByIndex || !context.getCurrentScrollInfo) {
        console.warn('ReportActionsListHelpers functions are not yet available');
        return null;
    }

    return context;
};

export {ReportActionsListContext};
