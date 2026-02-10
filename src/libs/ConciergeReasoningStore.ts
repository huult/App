/**
 * Ephemeral in-memory store for managing Concierge reasoning summaries per report.
 * This data is transient UI feedback and is NOT persisted to Onyx.
 */

type ReasoningEntry = {
    reasoning: string;
    loopCount: number;
    timestamp: number;
};

type ReasoningData = {
    reasoning: string;
    agentZeroRequestID: string;
    loopCount: number;
};

type ReportState = {
    agentZeroRequestID: string;
    entries: ReasoningEntry[];
};

type Listener = () => void;

// In-memory store: reportID -> state
const store = new Map<string, ReportState>();

// Subscribers
const listeners = new Set<Listener>();

/**
 * Add a reasoning entry for a report.
 * - If agentZeroRequestID differs from current state, reset all entries (new request)
 * - Skip duplicates (same loopCount + same reasoning text)
 * - Ignore empty reasoning strings
 */
function addReasoning(reportID: string, data: ReasoningData): void {
    const {reasoning, agentZeroRequestID, loopCount} = data;

    // Ignore empty reasoning
    if (!reasoning.trim()) {
        return;
    }

    let state = store.get(reportID);

    // If agentZeroRequestID changed, reset entries (new request)
    if (state && state.agentZeroRequestID !== agentZeroRequestID) {
        state = {
            agentZeroRequestID,
            entries: [],
        };
        store.set(reportID, state);
    }

    // Initialize state if it doesn't exist
    if (!state) {
        state = {
            agentZeroRequestID,
            entries: [],
        };
        store.set(reportID, state);
    }

    // Check for duplicates (same loopCount + same reasoning)
    const isDuplicate = state.entries.some((entry) => entry.loopCount === loopCount && entry.reasoning === reasoning);

    if (isDuplicate) {
        return;
    }

    // Add the new entry
    const entry: ReasoningEntry = {
        reasoning,
        loopCount,
        timestamp: Date.now(),
    };

    state.entries.push(entry);

    // Notify subscribers
    notifyListeners();
}

/**
 * Remove all reasoning entries for a report.
 * Called when the final Concierge message arrives or when unsubscribing.
 */
function clearReasoning(reportID: string): void {
    const hadEntries = store.has(reportID);
    store.delete(reportID);

    if (hadEntries) {
        // Notify subscribers only if there was data to clear
        notifyListeners();
    }
}

/**
 * Get the reasoning history for a report.
 * Returns an empty array if no entries exist.
 */
function getReasoningHistory(reportID: string): ReasoningEntry[] {
    const state = store.get(reportID);
    return state ? [...state.entries] : [];
}

/**
 * Subscribe to state changes.
 * Returns an unsubscribe function.
 */
function subscribe(listener: Listener): () => void {
    listeners.add(listener);

    // Return unsubscribe function
    return () => {
        listeners.delete(listener);
    };
}

/**
 * Notify all subscribers of a state change
 * Catches and logs any errors from listeners to prevent one failing listener from affecting others
 */
function notifyListeners(): void {
    for (const listener of listeners) {
        try {
            listener();
        } catch (error) {
            // Log error but continue notifying other listeners
            console.error('Error in ConciergeReasoningStore listener:', error);
        }
    }
}

export {addReasoning, clearReasoning, getReasoningHistory, subscribe};
export type {ReasoningEntry, ReasoningData};
