import * as ConciergeReasoningStore from '@libs/ConciergeReasoningStore';

describe('ConciergeReasoningStore', () => {
    // Clear the store after each test
    afterEach(() => {
        ConciergeReasoningStore.clearReasoning('report1');
        ConciergeReasoningStore.clearReasoning('report2');
        ConciergeReasoningStore.clearReasoning('report3');
    });

    describe('addReasoning', () => {
        it('should add reasoning entries for a report', () => {
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'Thinking about the problem...',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });

            const history = ConciergeReasoningStore.getReasoningHistory('report1');
            expect(history).toHaveLength(1);
            expect(history.at(0)?.reasoning).toBe('Thinking about the problem...');
            expect(history.at(0)?.loopCount).toBe(1);
            expect(history.at(0)?.timestamp).toBeDefined();
        });

        it('should add multiple reasoning entries in order', () => {
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'First thought',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'Second thought',
                agentZeroRequestID: 'request1',
                loopCount: 2,
            });
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'Third thought',
                agentZeroRequestID: 'request1',
                loopCount: 3,
            });

            const history = ConciergeReasoningStore.getReasoningHistory('report1');
            expect(history).toHaveLength(3);
            expect(history.at(0)?.reasoning).toBe('First thought');
            expect(history.at(1)?.reasoning).toBe('Second thought');
            expect(history.at(2)?.reasoning).toBe('Third thought');
        });

        it('should include timestamp for each entry', () => {
            const beforeTimestamp = Date.now();
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'Timestamped thought',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });
            const afterTimestamp = Date.now();

            const history = ConciergeReasoningStore.getReasoningHistory('report1');
            const entry = history.at(0);
            expect(entry?.timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
            expect(entry?.timestamp).toBeLessThanOrEqual(afterTimestamp);
        });
    });

    describe('ignoring empty reasoning', () => {
        it('should ignore empty reasoning strings', () => {
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: '',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });

            const history = ConciergeReasoningStore.getReasoningHistory('report1');
            expect(history).toHaveLength(0);
        });

        it('should ignore whitespace-only reasoning strings', () => {
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: '   ',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });

            const history = ConciergeReasoningStore.getReasoningHistory('report1');
            expect(history).toHaveLength(0);
        });

        it('should ignore tab and newline only strings', () => {
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: '\t\n\r',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });

            const history = ConciergeReasoningStore.getReasoningHistory('report1');
            expect(history).toHaveLength(0);
        });

        it('should accept reasoning with valid content and whitespace', () => {
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: '  Valid thought  ',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });

            const history = ConciergeReasoningStore.getReasoningHistory('report1');
            expect(history).toHaveLength(1);
            expect(history.at(0)?.reasoning).toBe('  Valid thought  ');
        });
    });

    describe('reset on agentZeroRequestID change', () => {
        it('should reset entries when agentZeroRequestID changes', () => {
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'Old request thought 1',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'Old request thought 2',
                agentZeroRequestID: 'request1',
                loopCount: 2,
            });

            // Verify old entries exist
            let history = ConciergeReasoningStore.getReasoningHistory('report1');
            expect(history).toHaveLength(2);

            // Now a new request arrives
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'New request thought',
                agentZeroRequestID: 'request2',
                loopCount: 1,
            });

            history = ConciergeReasoningStore.getReasoningHistory('report1');
            expect(history).toHaveLength(1);
            expect(history.at(0)?.reasoning).toBe('New request thought');
        });

        it('should maintain entries for same agentZeroRequestID', () => {
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'First thought',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'Second thought',
                agentZeroRequestID: 'request1',
                loopCount: 2,
            });
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'Third thought',
                agentZeroRequestID: 'request1',
                loopCount: 3,
            });

            const history = ConciergeReasoningStore.getReasoningHistory('report1');
            expect(history).toHaveLength(3);
        });

        it('should handle multiple request ID changes', () => {
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'Request 1 thought',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });

            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'Request 2 thought',
                agentZeroRequestID: 'request2',
                loopCount: 1,
            });

            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'Request 3 thought',
                agentZeroRequestID: 'request3',
                loopCount: 1,
            });

            const history = ConciergeReasoningStore.getReasoningHistory('report1');
            expect(history).toHaveLength(1);
            expect(history.at(0)?.reasoning).toBe('Request 3 thought');
        });
    });

    describe('skipping duplicates', () => {
        it('should skip duplicate entries with same loopCount and reasoning', () => {
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'Thinking...',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'Thinking...',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });

            const history = ConciergeReasoningStore.getReasoningHistory('report1');
            expect(history).toHaveLength(1);
        });

        it('should allow same reasoning with different loopCount', () => {
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'Thinking...',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'Thinking...',
                agentZeroRequestID: 'request1',
                loopCount: 2,
            });

            const history = ConciergeReasoningStore.getReasoningHistory('report1');
            expect(history).toHaveLength(2);
            expect(history.at(0)?.loopCount).toBe(1);
            expect(history.at(1)?.loopCount).toBe(2);
        });

        it('should allow different reasoning with same loopCount', () => {
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'First thought',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'Different thought',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });

            const history = ConciergeReasoningStore.getReasoningHistory('report1');
            expect(history).toHaveLength(2);
            expect(history.at(0)?.reasoning).toBe('First thought');
            expect(history.at(1)?.reasoning).toBe('Different thought');
        });

        it('should skip multiple duplicate attempts', () => {
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'Unique thought',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });

            // Try adding the same entry 3 more times
            for (let i = 0; i < 3; i++) {
                ConciergeReasoningStore.addReasoning('report1', {
                    reasoning: 'Unique thought',
                    agentZeroRequestID: 'request1',
                    loopCount: 1,
                });
            }

            const history = ConciergeReasoningStore.getReasoningHistory('report1');
            expect(history).toHaveLength(1);
        });
    });

    describe('preserving order', () => {
        it('should preserve arrival order of entries', () => {
            const entries = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
            for (const [index, reasoning] of entries.entries()) {
                ConciergeReasoningStore.addReasoning('report1', {
                    reasoning,
                    agentZeroRequestID: 'request1',
                    loopCount: index + 1,
                });
            }

            const history = ConciergeReasoningStore.getReasoningHistory('report1');
            expect(history).toHaveLength(5);
            for (const [index, reasoning] of entries.entries()) {
                expect(history.at(index)?.reasoning).toBe(reasoning);
                expect(history.at(index)?.loopCount).toBe(index + 1);
            }
        });

        it('should maintain order with non-sequential loopCounts', () => {
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'Loop 5',
                agentZeroRequestID: 'request1',
                loopCount: 5,
            });
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'Loop 2',
                agentZeroRequestID: 'request1',
                loopCount: 2,
            });
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'Loop 10',
                agentZeroRequestID: 'request1',
                loopCount: 10,
            });

            const history = ConciergeReasoningStore.getReasoningHistory('report1');
            expect(history).toHaveLength(3);
            expect(history.at(0)?.reasoning).toBe('Loop 5');
            expect(history.at(1)?.reasoning).toBe('Loop 2');
            expect(history.at(2)?.reasoning).toBe('Loop 10');
        });

        it('should preserve timestamps in order', () => {
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'First',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });

            // Small delay to ensure different timestamps
            const delayPromise = new Promise((resolve) => {
                setTimeout(resolve, 10);
            });
            return delayPromise.then(() => {
                ConciergeReasoningStore.addReasoning('report1', {
                    reasoning: 'Second',
                    agentZeroRequestID: 'request1',
                    loopCount: 2,
                });

                const history = ConciergeReasoningStore.getReasoningHistory('report1');
                expect(history.at(0)?.timestamp).toBeLessThanOrEqual(history.at(1)?.timestamp ?? 0);
            });
        });
    });

    describe('clearing reasoning per report only', () => {
        it('should only clear reasoning for the specified report', () => {
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'Report 1 thought',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });
            ConciergeReasoningStore.addReasoning('report2', {
                reasoning: 'Report 2 thought',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });
            ConciergeReasoningStore.addReasoning('report3', {
                reasoning: 'Report 3 thought',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });

            ConciergeReasoningStore.clearReasoning('report1');

            const history1 = ConciergeReasoningStore.getReasoningHistory('report1');
            const history2 = ConciergeReasoningStore.getReasoningHistory('report2');
            const history3 = ConciergeReasoningStore.getReasoningHistory('report3');

            expect(history1).toHaveLength(0);
            expect(history2).toHaveLength(1);
            expect(history2.at(0)?.reasoning).toBe('Report 2 thought');
            expect(history3).toHaveLength(1);
            expect(history3.at(0)?.reasoning).toBe('Report 3 thought');
        });

        it('should handle clearing non-existent report gracefully', () => {
            expect(() => {
                ConciergeReasoningStore.clearReasoning('nonExistentReport');
            }).not.toThrow();
        });

        it('should allow re-adding reasoning after clearing', () => {
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'First thought',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });

            ConciergeReasoningStore.clearReasoning('report1');

            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'New thought after clear',
                agentZeroRequestID: 'request2',
                loopCount: 1,
            });

            const history = ConciergeReasoningStore.getReasoningHistory('report1');
            expect(history).toHaveLength(1);
            expect(history.at(0)?.reasoning).toBe('New thought after clear');
        });

        it('should clear multiple entries for a single report', () => {
            for (let i = 1; i <= 5; i++) {
                ConciergeReasoningStore.addReasoning('report1', {
                    reasoning: `Thought ${i}`,
                    agentZeroRequestID: 'request1',
                    loopCount: i,
                });
            }

            let history = ConciergeReasoningStore.getReasoningHistory('report1');
            expect(history).toHaveLength(5);

            ConciergeReasoningStore.clearReasoning('report1');

            history = ConciergeReasoningStore.getReasoningHistory('report1');
            expect(history).toHaveLength(0);
        });
    });

    describe('getReasoningHistory', () => {
        it('should return empty array for report with no reasoning', () => {
            const history = ConciergeReasoningStore.getReasoningHistory('nonExistentReport');
            expect(history).toEqual([]);
        });

        it('should return a copy of the history array', () => {
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'Original thought',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });

            const history1 = ConciergeReasoningStore.getReasoningHistory('report1');
            const history2 = ConciergeReasoningStore.getReasoningHistory('report1');

            // Should be equal but not the same reference
            expect(history1).toEqual(history2);
            expect(history1).not.toBe(history2);
        });
    });

    describe('subscribe and unsubscribe behavior', () => {
        it('should notify subscribers when reasoning is added', () => {
            const listener = jest.fn();
            const unsubscribe = ConciergeReasoningStore.subscribe(listener);

            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'New thought',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });

            expect(listener).toHaveBeenCalledTimes(1);

            unsubscribe();
        });

        it('should notify subscribers when reasoning is cleared', () => {
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'Thought to be cleared',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });

            const listener = jest.fn();
            const unsubscribe = ConciergeReasoningStore.subscribe(listener);

            ConciergeReasoningStore.clearReasoning('report1');

            expect(listener).toHaveBeenCalledTimes(1);

            unsubscribe();
        });

        it('should not notify after unsubscribing', () => {
            const listener = jest.fn();
            const unsubscribe = ConciergeReasoningStore.subscribe(listener);

            unsubscribe();

            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'New thought',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });

            expect(listener).not.toHaveBeenCalled();
        });

        it('should support multiple subscribers', () => {
            const listener1 = jest.fn();
            const listener2 = jest.fn();
            const listener3 = jest.fn();
            const unsubscribe1 = ConciergeReasoningStore.subscribe(listener1);
            const unsubscribe2 = ConciergeReasoningStore.subscribe(listener2);
            const unsubscribe3 = ConciergeReasoningStore.subscribe(listener3);

            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'New thought',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });

            expect(listener1).toHaveBeenCalledTimes(1);
            expect(listener2).toHaveBeenCalledTimes(1);
            expect(listener3).toHaveBeenCalledTimes(1);

            unsubscribe1();
            unsubscribe2();
            unsubscribe3();
        });

        it('should allow selective unsubscribe', () => {
            const listener1 = jest.fn();
            const listener2 = jest.fn();
            const unsubscribe1 = ConciergeReasoningStore.subscribe(listener1);
            const unsubscribe2 = ConciergeReasoningStore.subscribe(listener2);

            // Unsubscribe first listener
            unsubscribe1();

            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'New thought',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });

            expect(listener1).not.toHaveBeenCalled();
            expect(listener2).toHaveBeenCalledTimes(1);

            unsubscribe2();
        });

        it('should not notify when empty reasoning is ignored', () => {
            const listener = jest.fn();
            const unsubscribe = ConciergeReasoningStore.subscribe(listener);

            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: '',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });

            expect(listener).not.toHaveBeenCalled();

            unsubscribe();
        });

        it('should not notify when duplicate is skipped', () => {
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'Existing thought',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });

            const listener = jest.fn();
            const unsubscribe = ConciergeReasoningStore.subscribe(listener);

            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'Existing thought',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });

            expect(listener).not.toHaveBeenCalled();

            unsubscribe();
        });

        it('should notify when agentZeroRequestID changes and clears history', () => {
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'Old request thought',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });

            const listener = jest.fn();
            const unsubscribe = ConciergeReasoningStore.subscribe(listener);

            // New request should clear and add, resulting in notification
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'New request thought',
                agentZeroRequestID: 'request2',
                loopCount: 1,
            });

            expect(listener).toHaveBeenCalledTimes(1);

            unsubscribe();
        });

        it('should handle unsubscribing the same listener multiple times', () => {
            const listener = jest.fn();
            const unsubscribe = ConciergeReasoningStore.subscribe(listener);

            unsubscribe();
            unsubscribe(); // Second call should not throw

            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'New thought',
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });

            expect(listener).not.toHaveBeenCalled();
        });

        it('should not throw when a listener throws an error', () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            const listener1 = jest.fn(() => {
                throw new Error('Listener 1 error');
            });
            const listener2 = jest.fn();

            const unsubscribe1 = ConciergeReasoningStore.subscribe(listener1);
            const unsubscribe2 = ConciergeReasoningStore.subscribe(listener2);

            // Add reasoning should not throw even if listener1 throws
            expect(() => {
                ConciergeReasoningStore.addReasoning('report1', {
                    reasoning: 'New thought',
                    agentZeroRequestID: 'request1',
                    loopCount: 1,
                });
            }).not.toThrow();

            // Both listeners should have been called
            expect(listener1).toHaveBeenCalledTimes(1);
            expect(listener2).toHaveBeenCalledTimes(1);

            // Error should have been logged
            expect(consoleErrorSpy).toHaveBeenCalled();

            unsubscribe1();
            unsubscribe2();
            consoleErrorSpy.mockRestore();
        });
    });

    describe('edge cases and integration scenarios', () => {
        it('should handle rapid successive additions', () => {
            for (let i = 1; i <= 20; i++) {
                ConciergeReasoningStore.addReasoning('report1', {
                    reasoning: `Rapid thought ${i}`,
                    agentZeroRequestID: 'request1',
                    loopCount: i,
                });
            }

            const history = ConciergeReasoningStore.getReasoningHistory('report1');
            expect(history).toHaveLength(20);
        });

        it('should handle very long reasoning strings', () => {
            const longReasoning = 'A'.repeat(10000);
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: longReasoning,
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });

            const history = ConciergeReasoningStore.getReasoningHistory('report1');
            expect(history.at(0)?.reasoning).toBe(longReasoning);
        });

        it('should handle special characters in reasoning', () => {
            const specialChars = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/\\`~';
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: specialChars,
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });

            const history = ConciergeReasoningStore.getReasoningHistory('report1');
            expect(history.at(0)?.reasoning).toBe(specialChars);
        });

        it('should handle unicode and emoji in reasoning', () => {
            const unicode = '思考中... 🤔 Размышляю... 💭';
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: unicode,
                agentZeroRequestID: 'request1',
                loopCount: 1,
            });

            const history = ConciergeReasoningStore.getReasoningHistory('report1');
            expect(history.at(0)?.reasoning).toBe(unicode);
        });

        it('should handle zero and negative loopCounts', () => {
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'Zero loop',
                agentZeroRequestID: 'request1',
                loopCount: 0,
            });
            ConciergeReasoningStore.addReasoning('report1', {
                reasoning: 'Negative loop',
                agentZeroRequestID: 'request1',
                loopCount: -1,
            });

            const history = ConciergeReasoningStore.getReasoningHistory('report1');
            expect(history).toHaveLength(2);
            expect(history.at(0)?.loopCount).toBe(0);
            expect(history.at(1)?.loopCount).toBe(-1);
        });
    });
});
