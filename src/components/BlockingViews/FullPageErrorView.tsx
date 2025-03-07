import React from 'react';
import {View} from 'react-native';
import type {StyleProp, TextStyle} from 'react-native';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import * as Illustrations from '@components/Icon/Illustrations';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import Navigation from '@libs/Navigation/Navigation';
import variables from '@styles/variables';
import type {TranslationPaths} from '@src/languages/types';
import BlockingView from './BlockingView';
import ForceFullScreenView from './ForceFullScreenView';

type FullPageErrorViewProps = {
    /** TestID for test */
    testID?: string;

    /** Child elements */
    children?: React.ReactNode;

    /** If true, child components are replaced with a blocking "not found" view */
    shouldShow?: boolean;

    /** The key in the translations file to use for the title */
    titleKey?: TranslationPaths;

    /** The key in the translations file to use for the subtitle. Pass an empty key to not show the subtitle. */
    subtitleKey?: TranslationPaths | '';

    /** Whether we should show a link to navigate elsewhere */
    shouldShowLink?: boolean;

    /** Whether we should show the back button on the header */
    shouldShowBackButton?: boolean;

    /** The key in the translations file to use for the go back link */
    linkKey?: TranslationPaths;

    /** Method to trigger when pressing the back button of the header */
    onBackButtonPress?: () => void;

    /** Function to call when pressing the navigation link */
    onLinkPress?: () => void;

    /** Whether we should force the full page view */
    shouldForceFullScreen?: boolean;

    /** The style of the subtitle message */
    subtitleStyle?: StyleProp<TextStyle>;

    /** Whether we should display the button that opens new SearchRouter */
    shouldDisplaySearchRouter?: boolean;
};

// eslint-disable-next-line rulesdir/no-negated-variables
function FullPageErrorView({
    testID,
    children = null,
    shouldShow = false,
    titleKey = 'pageError.title',
    subtitleKey = 'pageError.description',
    linkKey = 'pageError.goBackHome',
    onBackButtonPress = () => Navigation.goBack(),
    shouldShowLink = false,
    shouldShowBackButton = false,
    onLinkPress = () => Navigation.goBackToHome(),
    shouldForceFullScreen = false,
    subtitleStyle,
    shouldDisplaySearchRouter,
}: FullPageErrorViewProps) {
    const styles = useThemeStyles();
    const {translate} = useLocalize();

    if (shouldShow) {
        return (
            <ForceFullScreenView shouldForceFullScreen={shouldForceFullScreen}>
                <HeaderWithBackButton
                    onBackButtonPress={onBackButtonPress}
                    shouldShowBackButton={shouldShowBackButton}
                    shouldDisplaySearchRouter={shouldDisplaySearchRouter}
                />
                <View
                    style={[styles.flex1, styles.blockingViewContainer, {maxWidth: 500}]}
                    testID={testID}
                >
                    <BlockingView
                        icon={Illustrations.BrokenMagnifyingGlass}
                        iconWidth={variables.modalTopIconWidth}
                        iconHeight={variables.modalTopIconHeight}
                        title={translate(titleKey)}
                        subtitle={subtitleKey && translate(subtitleKey)}
                        shouldShowLink={shouldShowLink}
                        onLinkPress={onLinkPress}
                        subtitleStyle={subtitleStyle}
                    />
                </View>
            </ForceFullScreenView>
        );
    }

    return children;
}

FullPageErrorView.displayName = 'FullPageErrorView';

export type {FullPageErrorViewProps};
export default FullPageErrorView;
