import React, {useCallback, useMemo, useState} from 'react';
import type {LayoutChangeEvent, StyleProp, ViewStyle} from 'react-native';
import {StyleSheet, View} from 'react-native';
import SkeletonViewContentLoader from '@components/SkeletonViewContentLoader';
import useTheme from '@hooks/useTheme';
import useThemeStyles from '@hooks/useThemeStyles';
import CONST from '@src/CONST';

type ListItemSkeletonProps = {
    shouldAnimate?: boolean;
    renderSkeletonItem: (args: {itemIndex: number}) => React.ReactNode;
    fixedNumItems?: number;
    gradientOpacityEnabled?: boolean;
    itemViewStyle?: StyleProp<ViewStyle>;
    itemViewHeight?: number;
};

const getVerticalMargin = (style: StyleProp<ViewStyle>): number => {
    if (!style) {
        return 0;
    }

    const flattenStyle = StyleSheet.flatten(style);
    const marginVertical = Number(flattenStyle?.marginVertical ?? 0);
    const marginTop = Number(flattenStyle?.marginTop ?? 0);
    const marginBottom = Number(flattenStyle?.marginBottom ?? 0);

    return marginVertical + marginTop + marginBottom;
};

function ItemListSkeletonView({
    shouldAnimate = true,
    renderSkeletonItem,
    fixedNumItems,
    gradientOpacityEnabled = false,
    itemViewStyle = {},
    itemViewHeight = CONST.LHN_SKELETON_VIEW_ITEM_HEIGHT,
}: ListItemSkeletonProps) {
    const theme = useTheme();
    const themeStyles = useThemeStyles();

    const [numItems, setNumItems] = useState(fixedNumItems ?? 0);
    const [containerHeight, setContainerHeight] = useState(0);
    const totalItemHeight = itemViewHeight + getVerticalMargin(itemViewStyle);

    const handleLayout = useCallback(
        (event: LayoutChangeEvent) => {
            if (fixedNumItems) {
                return;
            }

            const availableHeight = event.nativeEvent.layout.height;
            setContainerHeight(availableHeight);

            const newNumItems = Math.floor(availableHeight / totalItemHeight);
            if (newNumItems !== numItems) {
                setNumItems(newNumItems);
            }
        },
        [fixedNumItems, numItems, totalItemHeight],
    );

    const skeletonViewItems = useMemo(() => {
        return Array.from({length: numItems}, (_, i) => {
            const opacity = gradientOpacityEnabled ? 1 - i / (numItems - 1) : 1;
            return (
                <SkeletonViewContentLoader
                    key={`skeletonContainer${i}`}
                    animate={shouldAnimate}
                    height={itemViewHeight}
                    backgroundColor={theme.skeletonLHNIn}
                    foregroundColor={theme.skeletonLHNOut}
                    style={[themeStyles.mr5, itemViewStyle, {opacity}, {minHeight: itemViewHeight}]}
                >
                    {renderSkeletonItem({itemIndex: i})}
                </SkeletonViewContentLoader>
            );
        });
    }, [numItems, shouldAnimate, theme, themeStyles, renderSkeletonItem, gradientOpacityEnabled, itemViewHeight, itemViewStyle]);

    return (
        <View
            style={[
                themeStyles.flex1,
                {height: containerHeight}, // Prevent scrolling
            ]}
            onLayout={handleLayout}
        >
            {skeletonViewItems}
        </View>
    );
}

ItemListSkeletonView.displayName = 'ListItemSkeleton';

export default ItemListSkeletonView;
