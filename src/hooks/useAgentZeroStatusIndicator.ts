import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {subscribeToReportReasoningEvents, unsubscribeFromReportReasoningChannel} from '@libs/actions/Report';
import ConciergeReasoningStore from '@libs/ConciergeReasoningStore';
import type {ReasoningEntry} from '@libs/ConciergeReasoningStore';
import * as ReportActionsUtils from '@libs/ReportActionsUtils';
import CONST from '@src/CONST';
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
 * Hook to manage AgentZero status indicator for Concierge chats.
 * Subscribes to real-time reasoning updates via Pusher and manages processing state.
 */
function useAgentZeroStatusIndicator(reportID: string, isConciergeChat: boolean): AgentZeroStatusState {
    const [reportNameValuePairs] = useOnyx(`${ONYXKEYS.COLLECTION.REPORT_NAME_VALUE_PAIRS}${reportID}`, {canBeMissing: true});
    const serverLabel = reportNameValuePairs?.agentZeroProcessingRequestIndicator?.trim() ?? '';

    const [reportActions] = useOnyx(`${ONYXKEYS.COLLECTION.REPORT_ACTIONS}${reportID}`, {canBeMissing: true});
    const [session] = useOnyx(ONYXKEYS.SESSION, {canBeMissing: true});
    const currentUserAccountID = session?.accountID;

    const [optimisticStartTime, setOptimisticStartTime] = useState<number | null>(null);
    const [reasoningHistory, setReasoningHistory] = useState<ReasoningEntry[]>([]);
    const {translate} = useLocalize();
    const prevServerLabelRef = useRef<string>(serverLabel);
    const prevHasPendingUserMessageRef = useRef<boolean>(false);

    // Check if there's a pending message from the current user (handles page refresh case)
    const hasPendingUserMessage = useMemo(() => {
        if (!isConciergeChat || !reportActions || !currentUserAccountID) {
            return false;
        }

        const lastVisibleAction = ReportActionsUtils.getLastVisibleAction(reportID, undefined, reportActions);
        return lastVisibleAction?.actorAccountID === currentUserAccountID && lastVisibleAction?.pendingAction === CONST.RED_BRICK_ROAD_PENDING_ACTION.ADD;
    }, [isConciergeChat, reportActions, reportID, currentUserAccountID]);

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

    useEffect(() => {
        const hadServerLabel = !!prevServerLabelRef.current;
        const hasServerLabel = !!serverLabel;
        const hadPendingMessage = prevHasPendingUserMessageRef.current;

        if (hadServerLabel && !hasServerLabel) {
            setOptimisticStartTime(null);

            if (reasoningHistory.length > 0) {
                ConciergeReasoningStore.clearReasoning(reportID);
            }
        }

        // Clear optimistic state when a pending message was removed (successfully sent)
        // Only clear if we HAD a pending message and now we don't
        if (optimisticStartTime && hadPendingMessage && !hasPendingUserMessage && !serverLabel) {
            setOptimisticStartTime(null);
        }

        prevServerLabelRef.current = serverLabel;
        prevHasPendingUserMessageRef.current = hasPendingUserMessage;
    }, [serverLabel, reasoningHistory.length, reportID, optimisticStartTime, hasPendingUserMessage]);

    // Optimistically trigger processing state when user sends a message
    const kickoffWaitingIndicator = useCallback(() => {
        if (!isConciergeChat) {
            return;
        }
        setOptimisticStartTime(Date.now());
    }, [isConciergeChat]);

    // Determine if Concierge is currently processing
    // Include hasPendingUserMessage to handle page refresh with pending messages
    const isProcessing = isConciergeChat && (!!serverLabel || !!optimisticStartTime || hasPendingUserMessage);

    // Determine the display label
    // Priority: serverLabel > "Thinking..." (if optimistic or pending) > empty
    const statusLabel = serverLabel || (optimisticStartTime || hasPendingUserMessage ? translate('common.thinking') : '');

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
