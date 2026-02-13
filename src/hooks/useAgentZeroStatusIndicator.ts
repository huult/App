import {useCallback, useEffect, useMemo, useState} from 'react';
import {subscribeToReportReasoningEvents, unsubscribeFromReportReasoningChannel} from '@libs/actions/Report';
import ConciergeReasoningStore from '@libs/ConciergeReasoningStore';
import type {ReasoningEntry} from '@libs/ConciergeReasoningStore';
import ONYXKEYS from '@src/ONYXKEYS';
import useLocalize from './useLocalize';
import useOnyx from './useOnyx';

type AgentZeroStatusState = {
    isProcessing: boolean; // Whether Concierge is currently working
    reasoningHistory: ReasoningEntry[]; // Real-time reasoning summaries
    statusLabel: string; // Server-driven status label (from reportNameValuePairs)
    kickoffWaitingIndicator: () => void; // Optimistic processing state trigger
};

/**
 * Hook to manage AgentZero status indicator for Concierge chats.
 * Subscribes to real-time reasoning updates via Pusher and manages processing state.
 */
function useAgentZeroStatusIndicator(reportID: string, isConciergeChat: boolean): AgentZeroStatusState {
    const [reportNameValuePairs] = useOnyx(`${ONYXKEYS.COLLECTION.REPORT_NAME_VALUE_PAIRS}${reportID}`, {canBeMissing: true});
    const serverLabel = reportNameValuePairs?.agentZeroProcessingRequestIndicator?.trim() ?? '';

    const [optimisticStartTime, setOptimisticStartTime] = useState<number | null>(null);
    const [reasoningHistory, setReasoningHistory] = useState<ReasoningEntry[]>([]);
    const {translate} = useLocalize();

    useEffect(() => {
        setReasoningHistory(ConciergeReasoningStore.getReasoningHistory(reportID));
    }, [reportID]);

    // Subscribe to ConciergeReasoningStore for real-time reasoning updates
    useEffect(() => {
        const unsubscribe = ConciergeReasoningStore.subscribe((updatedReportID, entries) => {
            if (updatedReportID !== reportID) {
                return;
            }
            setReasoningHistory(entries);
        });

        return unsubscribe;
    }, [reportID]);

    // Subscribe/unsubscribe to Pusher reasoning events for Concierge chats
    useEffect(() => {
        if (!isConciergeChat) {
            return;
        }

        subscribeToReportReasoningEvents(reportID);

        // Cleanup: unsubscribeFromReportReasoningChannel handles Pusher unsubscribing,
        // clearing reasoning history from ConciergeReasoningStore, and subscription tracking
        return () => {
            unsubscribeFromReportReasoningChannel(reportID);
        };
    }, [isConciergeChat, reportID]);

    // Optimistically trigger processing state when user sends a message
    const kickoffWaitingIndicator = useCallback(() => {
        if (!isConciergeChat || serverLabel) {
            return;
        }
        setOptimisticStartTime(Date.now());
    }, [isConciergeChat, serverLabel]);

    // Determine if Concierge is currently processing
    const isProcessing = isConciergeChat && (!!serverLabel || !!optimisticStartTime);

    // Determine the display label
    const statusLabel = optimisticStartTime && !serverLabel ? translate('common.thinking') : serverLabel;

    return useMemo(
        () => ({
            isProcessing,
            reasoningHistory,
            statusLabel,
            kickoffWaitingIndicator,
        }),
        [isProcessing, reasoningHistory, statusLabel, kickoffWaitingIndicator],
    );
}

export default useAgentZeroStatusIndicator;
export type {AgentZeroStatusState};
