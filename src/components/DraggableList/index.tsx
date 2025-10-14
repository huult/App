import type {DragEndEvent} from '@dnd-kit/core';
import {closestCenter, DndContext, PointerSensor, useSensor} from '@dnd-kit/core';
import {restrictToParentElement, restrictToVerticalAxis} from '@dnd-kit/modifiers';
import {arrayMove, SortableContext, verticalListSortingStrategy} from '@dnd-kit/sortable';
import React, {useCallback, useRef} from 'react';
// eslint-disable-next-line no-restricted-imports
import type {ScrollView as RNScrollView} from 'react-native';
import ScrollView from '@components/ScrollView';
import useThemeStyles from '@hooks/useThemeStyles';
import SortableItem from './SortableItem';
import type DraggableListProps from './types';

const minimumActivationDistance = 5; // pointer must move at least this much before starting to drag
const AUTO_SCROLL_EDGE_DISTANCE = 50; // Distance from edge to trigger auto-scroll
const AUTO_SCROLL_SPEED = 10; // Scroll speed in pixels per frame

/**
 * Draggable (vertical) list using dnd-kit. Dragging is restricted to the vertical axis only
 *
 */
function DraggableList<T>({
    data = [],
    renderItem,
    keyExtractor,
    onDragEnd: onDragEndCallback,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ListFooterComponent,
    ref,
}: DraggableListProps<T> & {ref?: React.ForwardedRef<RNScrollView>}) {
    const styles = useThemeStyles();
    const scrollViewRef = useRef<RNScrollView>(null);
    const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const items = data.map((item, index) => {
        return keyExtractor(item, index);
    });

    /**
     * Auto-scroll functionality to scroll the list when dragging near edges
     */
    const handleAutoScroll = useCallback((clientY: number) => {
        const scrollView = scrollViewRef.current;
        if (!scrollView) {
            return;
        }

        // Get the scroll view's position and dimensions
        const scrollElement = scrollView as unknown as HTMLElement;
        const rect = scrollElement.getBoundingClientRect?.();
        if (!rect) {
            return;
        }

        const {top, bottom} = rect;
        const distanceFromTop = clientY - top;
        const distanceFromBottom = bottom - clientY;

        // Clear existing auto-scroll
        if (autoScrollIntervalRef.current) {
            clearInterval(autoScrollIntervalRef.current);
            autoScrollIntervalRef.current = null;
        }

        // Check if we're near the top edge and should scroll up
        if (distanceFromTop <= AUTO_SCROLL_EDGE_DISTANCE && distanceFromTop > 0) {
            autoScrollIntervalRef.current = setInterval(() => {
                const currentScrollTop = scrollElement.scrollTop || 0;
                scrollElement.scrollTop = Math.max(0, currentScrollTop - AUTO_SCROLL_SPEED);
            }, 16); // ~60fps
        }
        // Check if we're near the bottom edge and should scroll down
        else if (distanceFromBottom <= AUTO_SCROLL_EDGE_DISTANCE && distanceFromBottom > 0) {
            autoScrollIntervalRef.current = setInterval(() => {
                const currentScrollTop = scrollElement.scrollTop || 0;
                scrollElement.scrollTop = currentScrollTop + AUTO_SCROLL_SPEED;
            }, 16); // ~60fps
        }
    }, []);

    /**
     * Stop auto-scroll when dragging ends
     */
    const stopAutoScroll = useCallback(() => {
        if (!autoScrollIntervalRef.current) {
            return;
        }
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
    }, []);

    /**
     * Handle drag start - initialize auto-scroll tracking
     */
    const onDragStart = useCallback(() => {
        // Start monitoring mouse position for auto-scroll
        const handleMouseMove = (e: MouseEvent) => {
            handleAutoScroll(e.clientY);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', handleMouseMove);
            stopAutoScroll();
        }, {once: true});
    }, [handleAutoScroll, stopAutoScroll]);

    /**
     * Function to be called when the user finishes dragging an item
     * It will reorder the list and call the callback function
     * to notify the parent component about the change
     */
    const onDragEnd = useCallback((event: DragEndEvent) => {
        // Stop auto-scroll when drag ends
        stopAutoScroll();

        const {active, over} = event;

        if (over !== null && active.id !== over.id) {
            const oldIndex = items.indexOf(active.id.toString());
            const newIndex = items.indexOf(over.id.toString());

            const reorderedItems = arrayMove(data, oldIndex, newIndex);
            onDragEndCallback?.({data: reorderedItems});
        }
    }, [items, data, onDragEndCallback, stopAutoScroll]);

    const sortableItems = data.map((item, index) => {
        const key = keyExtractor(item, index);
        return (
            <SortableItem
                id={key}
                key={key}
            >
                {renderItem({
                    item,
                    getIndex: () => index,
                    isActive: false,
                    drag: () => {},
                })}
            </SortableItem>
        );
    });

    const sensors = [
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: minimumActivationDistance,
            },
        }),
    ];

    return (
        <ScrollView
            ref={(node) => {
                scrollViewRef.current = node;
                if (typeof ref === 'function') {
                    ref(node);
                } else if (ref && 'current' in ref) {
                    // eslint-disable-next-line no-param-reassign
                    ref.current = node;
                }
            }}
            style={styles.flex1}
            contentContainerStyle={styles.flex1}
        >
            <div>
                <DndContext
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    modifiers={[restrictToParentElement, restrictToVerticalAxis]}
                >
                    <SortableContext
                        items={items}
                        strategy={verticalListSortingStrategy}
                    >
                        {sortableItems}
                    </SortableContext>
                </DndContext>
            </div>
            {ListFooterComponent}
        </ScrollView>
    );
}

DraggableList.displayName = 'DraggableList';

export default DraggableList;
