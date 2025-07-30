import React, {useCallback, useMemo} from 'react';
import {View} from 'react-native';
import useLocalize from '@hooks/useLocalize';
import useNetwork from '@hooks/useNetwork';
import useOnyx from '@hooks/useOnyx';
import usePermissions from '@hooks/usePermissions';
import useResponsiveLayout from '@hooks/useResponsiveLayout';
import useThemeStyles from '@hooks/useThemeStyles';
import {navigateAfterOnboardingWithMicrotaskQueue} from '@libs/navigateAfterOnboarding';
import Navigation from '@libs/Navigation/Navigation';
import {getDefaultWorkspaceAvatar} from '@libs/ReportUtils';
import {askToJoinPolicy, joinAccessiblePolicy} from '@userActions/Policy/Member';
import {completeOnboarding} from '@userActions/Report';
import {setOnboardingAdminsChatReportID, setOnboardingPolicyID} from '@userActions/Welcome';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import type {JoinablePolicy} from '@src/types/onyx/JoinablePolicies';
import Button from './Button';
import HeaderWithBackButton from './HeaderWithBackButton';
import * as Expensicons from './Icon/Expensicons';
import ScreenWrapper from './ScreenWrapper';
import SelectionList from './SelectionList';
import UserListItem from './SelectionList/UserListItem';
import Text from './Text';

type DomainRestrictedWorkspaceModalProps = {
    /** Should use native styles tailored for native devices */
    shouldUseNativeStyles?: boolean;
};

function DomainRestrictedWorkspaceModal({shouldUseNativeStyles}: DomainRestrictedWorkspaceModalProps) {
    const {isOffline} = useNetwork();
    const styles = useThemeStyles();
    const {translate} = useLocalize();

    // We need to use isSmallScreenWidth, see navigateAfterOnboarding function comment
    // eslint-disable-next-line rulesdir/prefer-shouldUseNarrowLayout-instead-of-isSmallScreenWidth
    const {onboardingIsMediumOrLargerScreenWidth, isSmallScreenWidth} = useResponsiveLayout();
    const [joinablePolicies] = useOnyx(ONYXKEYS.JOINABLE_POLICIES, {canBeMissing: true});

    const [onboardingPersonalDetails] = useOnyx(ONYXKEYS.FORMS.ONBOARDING_PERSONAL_DETAILS_FORM, {canBeMissing: true});

    const {isBetaEnabled} = usePermissions();

    const handleJoinWorkspace = useCallback(
        (policy: JoinablePolicy) => {
            if (policy.automaticJoiningEnabled) {
                joinAccessiblePolicy(policy.policyID);
            } else {
                askToJoinPolicy(policy.policyID);
            }
            completeOnboarding({
                engagementChoice: CONST.ONBOARDING_CHOICES.LOOKING_AROUND,
                onboardingMessage: undefined,
                firstName: onboardingPersonalDetails?.firstName ?? '',
                lastName: onboardingPersonalDetails?.lastName ?? '',
            });
            setOnboardingAdminsChatReportID();
            setOnboardingPolicyID(policy.policyID);

            navigateAfterOnboardingWithMicrotaskQueue(isSmallScreenWidth, isBetaEnabled(CONST.BETAS.DEFAULT_ROOMS), policy.automaticJoiningEnabled ? policy.policyID : undefined);
        },
        [onboardingPersonalDetails?.firstName, onboardingPersonalDetails?.lastName, isSmallScreenWidth, isBetaEnabled],
    );

    const handleSkip = useCallback(() => {
        completeOnboarding({
            engagementChoice: CONST.ONBOARDING_CHOICES.LOOKING_AROUND,
            onboardingMessage: undefined,
            firstName: onboardingPersonalDetails?.firstName ?? '',
            lastName: onboardingPersonalDetails?.lastName ?? '',
        });
        setOnboardingAdminsChatReportID();
        setOnboardingPolicyID();

        navigateAfterOnboardingWithMicrotaskQueue(isSmallScreenWidth, isBetaEnabled(CONST.BETAS.DEFAULT_ROOMS));
    }, [onboardingPersonalDetails?.firstName, onboardingPersonalDetails?.lastName, isSmallScreenWidth, isBetaEnabled]);

    const policyIDItems = useMemo(() => {
        return Object.values(joinablePolicies ?? {}).map((policyInfo) => {
            return {
                text: policyInfo.policyName,
                alternateText: translate('onboarding.workspaceMemberList', {employeeCount: policyInfo.employeeCount, policyOwner: policyInfo.policyOwner}),
                keyForList: policyInfo.policyID,
                isDisabled: true,
                rightElement: (
                    <Button
                        isDisabled={isOffline}
                        success
                        medium
                        text={policyInfo.automaticJoiningEnabled ? translate('workspace.workspaceList.joinNow') : translate('workspace.workspaceList.askToJoin')}
                        onPress={() => {
                            handleJoinWorkspace(policyInfo);
                        }}
                    />
                ),
                icons: [
                    {
                        id: policyInfo.policyID,
                        source: getDefaultWorkspaceAvatar(policyInfo.policyName),
                        fallbackIcon: Expensicons.FallbackWorkspaceAvatar,
                        name: policyInfo.policyName,
                        type: CONST.ICON_TYPE_WORKSPACE,
                    },
                ],
            };
        });
    }, [translate, isOffline, joinablePolicies, handleJoinWorkspace]);

    const wrapperPadding = onboardingIsMediumOrLargerScreenWidth ? styles.mh8 : styles.mh5;

    const handleBackButtonPress = useCallback(() => {
        Navigation.goBack();
    }, []);

    return (
        <ScreenWrapper
            includeSafeAreaPaddingBottom
            shouldEnableMaxHeight
            testID="DomainRestrictedWorkspaceModal"
            style={[styles.defaultModalContainer, shouldUseNativeStyles && styles.pt8]}
            shouldShowOfflineIndicator={isSmallScreenWidth}
        >
            <HeaderWithBackButton
                shouldShowBackButton
                progressBarPercentage={60}
                onBackButtonPress={handleBackButtonPress}
            />
            <SelectionList
                sections={[{data: policyIDItems}]}
                onSelectRow={() => {}}
                ListItem={UserListItem}
                listItemWrapperStyle={onboardingIsMediumOrLargerScreenWidth ? [styles.pl8, styles.pr8, styles.cursorDefault] : []}
                shouldStopPropagation
                showScrollIndicator
                headerContent={
                    <View style={[wrapperPadding, onboardingIsMediumOrLargerScreenWidth && styles.mt5, styles.mb5]}>
                        <Text style={styles.textHeadlineH1}>{translate('onboarding.domainWorkspaceRestriction.title')}</Text>
                        <Text style={[styles.textSupporting, styles.mt3]}>{translate('onboarding.domainWorkspaceRestriction.subtitle')}</Text>
                    </View>
                }
                footerContent={
                    <Button
                        success={false}
                        large
                        text={translate('common.skip')}
                        testID="domainRestrictedWorkspaceSkipButton"
                        onPress={handleSkip}
                        style={[wrapperPadding, styles.mt5]}
                    />
                }
            />
        </ScreenWrapper>
    );
}

DomainRestrictedWorkspaceModal.displayName = 'DomainRestrictedWorkspaceModal';

export default DomainRestrictedWorkspaceModal;
