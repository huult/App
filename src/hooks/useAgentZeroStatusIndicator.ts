import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import * as ConciergeReasoningStore from '@libs/ConciergeReasoningStore';
import type {ReasoningEntry} from '@libs/ConciergeReasoningStore';
import * as Report from '@userActions/Report';
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
    const [optimisticLabel, setOptimisticLabel] = useState<string>();
    const [reasoningHistory, setReasoningHistory] = useState<ReasoningEntry[]>([]);
    const isWaitingForServerRef = useRef(false);
    const previousServerLabelRef = useRef<string | undefined>(serverLabel);

    // Subscribe to ConciergeReasoningStore changes for real-time reasoning updates
    useEffect(() => {
        const unsubscribe = ConciergeReasoningStore.subscribe(() => {
            setReasoningHistory(ConciergeReasoningStore.getReasoningHistory(reportID));
        });

        return unsubscribe;
    }, [reportID]);

    // Subscribe to Pusher reasoning events for Concierge chats
    useEffect(() => {
        if (!isConciergeChat || !reportID) {
            return;
        }

        Report.subscribeToReportReasoningEvents(reportID);

        return () => {
            Report.unsubscribeFromReportReasoningChannel(reportID);
        };
    }, [isConciergeChat, reportID]);

    // Clear optimistic label when server label appears or changes
    useEffect(() => {
        const serverLabelChanged = serverLabel !== previousServerLabelRef.current;
        previousServerLabelRef.current = serverLabel;

        if (serverLabelChanged && serverLabel && isWaitingForServerRef.current) {
            setOptimisticLabel(undefined);
            isWaitingForServerRef.current = false;
        }
    }, [serverLabel]);

    // Optimistically show "Thinking..." when user sends a message
    const kickoffWaitingIndicator = useCallback(() => {
        if (!isConciergeChat || serverLabel) {
            return;
        }

        setOptimisticLabel(translate('common.thinking'));
        isWaitingForServerRef.current = true;
    }, [isConciergeChat, serverLabel, translate]);

    // Determine the current display label
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
