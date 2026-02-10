import {useCallback, useEffect, useMemo, useState, useSyncExternalStore} from 'react';
import {getReasoningHistory, subscribe} from '@libs/ConciergeReasoningStore';
import type {ReasoningEntry} from '@libs/ConciergeReasoningStore';
import {subscribeToReportReasoningEvents, unsubscribeFromReportReasoningChannel} from '@userActions/Report';
import ONYXKEYS from '@src/ONYXKEYS';
import useLocalize from './useLocalize';
import useOnyx from './useOnyx';

type AgentZeroStatusState = {
    isProcessing: boolean;
    reasoningHistory: ReasoningEntry[];
    statusLabel: string;
    kickoffWaitingIndicator: () => void;
};

/**
 * Hook for managing AgentZero (Concierge AI) status indicator and reasoning display.
 *
 * Shows real-time thinking status with:
 * - Optimistic "Thinking..." immediately when user sends a message
 * - Server-driven status labels (e.g., "Concierge is creating an expense...")
 * - Real reasoning summaries from LLM via Pusher events
 */
function useAgentZeroStatusIndicator(reportID: string, isConciergeChat: boolean): AgentZeroStatusState {
    const {translate} = useLocalize();
    const [reportNameValuePairs] = useOnyx(`${ONYXKEYS.COLLECTION.REPORT_NAME_VALUE_PAIRS}${reportID}`, {canBeMissing: true});
    const serverLabel = reportNameValuePairs?.agentZeroProcessingRequestIndicator?.trim();
    const [kickoffTimestamp, setKickoffTimestamp] = useState(0);

    // Subscribe to ConciergeReasoningStore for real-time reasoning updates using useSyncExternalStore
    const reasoningHistory = useSyncExternalStore(
        subscribe,
        () => getReasoningHistory(reportID),
        () => [], // Server snapshot (empty for client-only store)
    );

    // Subscribe to Pusher reasoning events for Concierge chats
    useEffect(() => {
        if (!isConciergeChat || !reportID) {
            return;
        }

        subscribeToReportReasoningEvents(reportID);

        return () => {
            unsubscribeFromReportReasoningChannel(reportID);
        };
    }, [isConciergeChat, reportID]);

    // Optimistically show "Thinking..." when user sends a message
    const kickoffWaitingIndicator = useCallback(() => {
        if (!isConciergeChat || serverLabel) {
            return;
        }

        setKickoffTimestamp(Date.now());
    }, [isConciergeChat, serverLabel]);

    // Derive optimistic label: show if we kicked off AND server hasn't responded yet
    const shouldShowOptimistic = kickoffTimestamp > 0 && !serverLabel;
    const optimisticLabel = shouldShowOptimistic ? translate('common.thinking') : undefined;
    const displayLabel = isConciergeChat ? (optimisticLabel ?? serverLabel ?? '') : '';
    const isProcessing = !!displayLabel;

    return useMemo(
        () => ({
            isProcessing,
            reasoningHistory,
            statusLabel: displayLabel,
            kickoffWaitingIndicator,
        }),
        [isProcessing, reasoningHistory, displayLabel, kickoffWaitingIndicator],
    );
}

export default useAgentZeroStatusIndicator;
