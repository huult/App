import React from 'react';
import {View} from 'react-native';
import useTheme from '@hooks/useTheme';
import useThemeStyles from '@hooks/useThemeStyles';
import variables from '@styles/variables';
import type ChildrenProps from '@src/types/utils/ChildrenProps';
import Icon from './Icon';
import * as Expensicons from './Icon/Expensicons';

type CaretWrapperProps = ChildrenProps;

function CaretWrapper({children, customStyle}: CaretWrapperProps) {
    console.log('****** customStyle ******', customStyle);

    const theme = useTheme();
    const styles = useThemeStyles();
    console.log('****** styles.alignItemsCenter ******', styles.alignItemsCenter);

    return (
        <View style={[styles.flexRow, styles.gap1, styles.alignItemsCenter, customStyle]}>
            {children}
            <Icon
                src={Expensicons.DownArrow}
                fill={theme.icon}
                width={variables.iconSizeExtraSmall}
                height={variables.iconSizeExtraSmall}
            />
        </View>
    );
}

export default CaretWrapper;
