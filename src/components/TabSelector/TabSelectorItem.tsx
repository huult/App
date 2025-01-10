import {useIsFocused} from '@react-navigation/native';
import React, {useState} from 'react';
import {Animated} from 'react-native';
import PressableWithFeedback from '@components/Pressable/PressableWithFeedback';
import {useProductTrainingContext} from '@components/ProductTrainingContext';
import EducationalTooltip from '@components/Tooltip/EducationalTooltip';
import useThemeStyles from '@hooks/useThemeStyles';
import CONST from '@src/CONST';
import type IconAsset from '@src/types/utils/IconAsset';
import TabIcon from './TabIcon';
import TabLabel from './TabLabel';

const AnimatedPressableWithFeedback = Animated.createAnimatedComponent(PressableWithFeedback);

type TabSelectorItemProps = {
    /** Function to call when onPress */
    onPress?: () => void;

    /** Icon to display on tab */
    icon?: IconAsset;

    /** Title of the tab */
    title?: string;

    /** Animated background color value for the tab button */
    backgroundColor?: string | Animated.AnimatedInterpolation<string>;

    /** Animated opacity value while the tab is in inactive state */
    inactiveOpacity?: number | Animated.AnimatedInterpolation<number>;

    /** Animated opacity value while the tab is in active state */
    activeOpacity?: number | Animated.AnimatedInterpolation<number>;

    /** Whether this tab is active */
    isActive?: boolean;

    /** Whether to show the label when the tab is inactive */
    shouldShowLabelWhenInactive?: boolean;

    shouldShowEducationalTooltip?: boolean;
};

function TabSelectorItem({
    icon,
    title = '',
    onPress = () => {},
    backgroundColor = '',
    activeOpacity = 0,
    inactiveOpacity = 1,
    isActive = false,
    shouldShowLabelWhenInactive = true,
    shouldShowEducationalTooltip = false,
}: TabSelectorItemProps) {
    const styles = useThemeStyles();
    const [isHovered, setIsHovered] = useState(false);
    const isFocused = useIsFocused();

    const {renderProductTrainingTooltip, shouldShowProductTrainingTooltip, hideProductTrainingTooltip} = useProductTrainingContext(
        CONST.PRODUCT_TRAINING_TOOLTIP_NAMES.CREATE_EXPENSE_PER_DIEM,
        isFocused,
    );

    console.log('****** shouldShowEducationalTooltip ******', shouldShowEducationalTooltip);

    console.log('****** shouldShowProductTrainingTooltip ******', shouldShowProductTrainingTooltip);

    return (
        <EducationalTooltip
            shouldRender={!!(shouldShowEducationalTooltip && shouldShowProductTrainingTooltip)}
            renderTooltipContent={renderProductTrainingTooltip}
            wrapperStyle={styles.reportActionComposeTooltipWrapper}
        >
            <AnimatedPressableWithFeedback
                accessibilityLabel={title}
                style={[styles.tabSelectorButton, styles.tabBackground(isHovered, isActive, backgroundColor), styles.userSelectNone]}
                wrapperStyle={[styles.flexGrow1]}
                onPress={() => {
                    onPress();

                    // hideProductTrainingTooltip();
                }}
                onHoverIn={() => setIsHovered(true)}
                onHoverOut={() => setIsHovered(false)}
                role={CONST.ROLE.BUTTON}
                dataSet={{[CONST.SELECTION_SCRAPER_HIDDEN_ELEMENT]: true}}
            >
                <TabIcon
                    icon={icon}
                    activeOpacity={styles.tabOpacity(isHovered, isActive, activeOpacity, inactiveOpacity).opacity}
                    inactiveOpacity={styles.tabOpacity(isHovered, isActive, inactiveOpacity, activeOpacity).opacity}
                />
                {(shouldShowLabelWhenInactive || isActive) && (
                    <TabLabel
                        title={title}
                        activeOpacity={styles.tabOpacity(isHovered, isActive, activeOpacity, inactiveOpacity).opacity}
                        inactiveOpacity={styles.tabOpacity(isHovered, isActive, inactiveOpacity, activeOpacity).opacity}
                    />
                )}
            </AnimatedPressableWithFeedback>
        </EducationalTooltip>
    );
}

TabSelectorItem.displayName = 'TabSelectorItem';

export default TabSelectorItem;
