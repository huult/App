import React, {useMemo} from 'react';
import {ActivityIndicator, View} from 'react-native';
import MenuItemWithTopDescription from '@components/MenuItemWithTopDescription';
import Section from '@components/Section';
import useLocalize from '@hooks/useLocalize';
import usePolicy from '@hooks/usePolicy';
import useTheme from '@hooks/useTheme';
import useThemeStyles from '@hooks/useThemeStyles';
import Navigation from '@libs/Navigation/Navigation';
import {getParsedComment} from '@libs/ReportUtils';
import ROUTES from '@src/ROUTES';

type CustomRulesSectionProps = {
    policyID: string;
};

function CustomRulesSection({policyID}: CustomRulesSectionProps) {
    const {translate} = useLocalize();
    const styles = useThemeStyles();
    const policy = usePolicy(policyID);
    const parsedRules = useMemo(() => getParsedComment(policy?.customRules ?? '', policy?.isLoading ? {shouldEscapeText: false} : undefined), [policy]);

    const rulesDescription = typeof parsedRules === 'string' ? parsedRules : '';
    const theme = useTheme();

    return (
        <Section
            isCentralPane
            title={translate('workspace.rules.customRules.title')}
            subtitle={translate('workspace.rules.customRules.description')}
            titleStyles={styles.accountSettingsSectionTitle}
            subtitleMuted
        >
            <View style={[styles.mt3]}>
                {/* <OfflineWithFeedback
                    pendingAction={policy?.pendingFields?.customRules}
                    errors={policy?.errors?.customRules}
                > */}
                {/* {policy?.isLoading ? ( */}
                {false ? (
                    <ActivityIndicator
                        size="small"
                        color={theme.iconSuccessFill}
                        style={[styles.mt4, styles.ml1]}
                    />
                ) : (
                    <MenuItemWithTopDescription
                        title={rulesDescription}
                        description={translate('workspace.rules.customRules.subtitle')}
                        shouldShowRightIcon
                        interactive
                        wrapperStyle={styles.sectionMenuItemTopDescription}
                        onPress={() => Navigation.navigate(ROUTES.RULES_CUSTOM.getRoute(policyID))}
                        shouldRenderAsHTML
                    />
                )}

                {/* </OfflineWithFeedback> */}
            </View>
        </Section>
    );
}

export default CustomRulesSection;
