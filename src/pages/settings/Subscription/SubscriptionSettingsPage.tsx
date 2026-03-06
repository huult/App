import React, {useEffect} from 'react';
import {View} from 'react-native';
import FullScreenLoadingIndicator from '@components/FullscreenLoadingIndicator';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import ScreenWrapper from '@components/ScreenWrapper';
import ScrollView from '@components/ScrollView';
import useDynamicBackPath from '@hooks/useDynamicBackPath';
import {useMemoizedLazyIllustrations} from '@hooks/useLazyAsset';
import useLocalize from '@hooks/useLocalize';
import useOnyx from '@hooks/useOnyx';
import useResponsiveLayout from '@hooks/useResponsiveLayout';
import useSubscriptionPlan from '@hooks/useSubscriptionPlan';
import useThemeStyles from '@hooks/useThemeStyles';
import {openSubscriptionPage} from '@libs/actions/Subscription';
import Navigation from '@libs/Navigation/Navigation';
import ONYXKEYS from '@src/ONYXKEYS';
import {DYNAMIC_ROUTES} from '@src/ROUTES';
import SCREENS from '@src/SCREENS';
import CardSection from './CardSection/CardSection';
import SubscriptionPlan from './SubscriptionPlan';

function SubscriptionSettingsPage() {
    const backPath = useDynamicBackPath(DYNAMIC_ROUTES.ADD_BANK_ACCOUNT_VERIFY_ACCOUNT.path);
    const {shouldUseNarrowLayout} = useResponsiveLayout();
    const {translate} = useLocalize();
    const styles = useThemeStyles();
    const subscriptionPlan = useSubscriptionPlan();
    const illustrations = useMemoizedLazyIllustrations(['CreditCardsNew']);
    useEffect(() => {
        openSubscriptionPage();
    }, []);
    const [isAppLoading = true] = useOnyx(ONYXKEYS.IS_LOADING_APP);

    useEffect(() => {
        if (subscriptionPlan ?? isAppLoading) {
            return;
        }
        Navigation.removeScreenFromNavigationState(SCREENS.SETTINGS.SUBSCRIPTION.ROOT);
    }, [isAppLoading, subscriptionPlan]);

    if (!subscriptionPlan && isAppLoading) {
        return <FullScreenLoadingIndicator />;
    }

    if (!subscriptionPlan) {
        return null;
    }

    return (
        <ScreenWrapper
            testID="SubscriptionSettingsPage"
            shouldShowOfflineIndicatorInWideScreen
        >
            <HeaderWithBackButton
                title={translate('workspace.common.subscription')}
                onBackButtonPress={() => {
                    if (backPath) {
                        Navigation.goBack(backPath);
                        return;
                    }
                    Navigation.goBack();
                }}
                shouldShowBackButton={shouldUseNarrowLayout}
                shouldDisplaySearchRouter
                shouldDisplayHelpButton
                icon={illustrations.CreditCardsNew}
                shouldUseHeadlineHeader
            />
            <ScrollView style={styles.pt3}>
                <View style={[styles.flex1, shouldUseNarrowLayout ? styles.workspaceSectionMobile : styles.workspaceSection]}>
                    <CardSection />
                    <SubscriptionPlan />
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}

export default SubscriptionSettingsPage;
