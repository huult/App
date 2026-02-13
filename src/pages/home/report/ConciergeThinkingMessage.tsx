import React, {useMemo, useState} from 'react';
import {View} from 'react-native';
import type {OnyxEntry} from 'react-native-onyx';
import Icon from '@components/Icon';
import OfflineWithFeedback from '@components/OfflineWithFeedback';
import {PressableWithoutFeedback} from '@components/Pressable';
import RenderHTML from '@components/RenderHTML';
import ReportActionAvatars from '@components/ReportActionAvatars';
import useReportActionAvatars from '@components/ReportActionAvatars/useReportActionAvatars';
import Text from '@components/Text';
import UserDetailsTooltip from '@components/UserDetailsTooltip';
import {useMemoizedLazyExpensifyIcons} from '@hooks/useLazyAsset';
import useLocalize from '@hooks/useLocalize';
import useStyleUtils from '@hooks/useStyleUtils';
import useTheme from '@hooks/useTheme';
import useThemeStyles from '@hooks/useThemeStyles';
import type {ReasoningEntry} from '@libs/ConciergeReasoningStore';
import DateUtils from '@libs/DateUtils';
import Parser from '@libs/Parser';
import variables from '@styles/variables';
import CONST from '@src/CONST';
import type {Report, ReportAction} from '@src/types/onyx';

type ConciergeThinkingMessageProps = {
    /** The report for this thinking message */
    report: OnyxEntry<Report>;

    /** The report action if available */
    action?: OnyxEntry<ReportAction>;

    /** Reasoning history to display */
    reasoningHistory?: ReasoningEntry[];

    /** Status label text */
    statusLabel?: string;
};

function ConciergeThinkingMessage({report, action, reasoningHistory, statusLabel}: ConciergeThinkingMessageProps) {
    const styles = useThemeStyles();
    const theme = useTheme();
    const StyleUtils = useStyleUtils();
    const {datetimeToCalendarTime, translate} = useLocalize();
    const icons = useMemoizedLazyExpensifyIcons(['UpArrow', 'DownArrow']);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const historyLength = (reasoningHistory ?? [])?.length;

    const hasReasoningHistory = useMemo(() => !!reasoningHistory && reasoningHistory.length > 0, [reasoningHistory]);
    const currentTimestamp = DateUtils.getDBTime();

    // Get avatar data from report/action using the hook
    const {avatars, details} = useReportActionAvatars({report, action});

    const handleToggle = () => {
        if (!hasReasoningHistory) {
            return;
        }
        setIsExpanded(!isExpanded);
    };

    const getAccessibilityLabel = () => {
        if (!hasReasoningHistory) {
            return translate('common.thinking');
        }
        return isExpanded ? translate('concierge.collapseReasoning') : translate('concierge.expandReasoning');
    };

    return (
        <View style={[styles.chatItem, styles.mb3]}>
            {/* Avatar */}
            <View
                style={[styles.alignSelfStart, styles.mr3]}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <OfflineWithFeedback pendingAction={details.pendingFields?.avatar ?? undefined}>
                    <ReportActionAvatars
                        singleAvatarContainerStyle={[styles.actionAvatar]}
                        subscriptAvatarBorderColor={theme.appBG}
                        noRightMarginOnSubscriptContainer
                        isInReportAction
                        shouldShowTooltip
                        secondaryAvatarContainerStyle={[
                            StyleUtils.getBackgroundAndBorderStyle(theme.appBG),
                            isHovered ? StyleUtils.getBackgroundAndBorderStyle(theme.hoverComponentBG) : undefined,
                        ]}
                        reportID={report?.reportID}
                        chatReportID={report?.chatReportID ?? report?.reportID}
                        action={action}
                    />
                </OfflineWithFeedback>
            </View>

            {/* Message Content */}
            <View style={[styles.chatItemRight]}>
                {/* Message Header */}
                <View style={[styles.chatItemMessageHeader]}>
                    <UserDetailsTooltip
                        accountID={details.accountID ?? CONST.ACCOUNT_ID.CONCIERGE}
                        icon={avatars.at(0)}
                    >
                        <Text style={[styles.chatItemMessageHeaderSender, styles.flexShrink1, styles.mr1]}>{details.displayName ?? CONST.CONCIERGE_DISPLAY_NAME}</Text>
                    </UserDetailsTooltip>
                    <Text style={[styles.chatItemMessageHeaderTimestamp]}>{datetimeToCalendarTime(currentTimestamp, false, false)}</Text>
                </View>

                {/* Status Text with Optional Toggle */}
                <PressableWithoutFeedback
                    onPress={handleToggle}
                    disabled={!hasReasoningHistory}
                    accessibilityRole={hasReasoningHistory ? CONST.ROLE.BUTTON : undefined}
                    accessibilityLabel={getAccessibilityLabel()}
                    sentryLabel="ConciergeThinkingMessage-ToggleReasoning"
                    accessible
                >
                    <View style={[styles.flexRow, styles.alignItemsCenter]}>
                        <Text style={[styles.chatItemMessage, styles.colorMuted]}>{statusLabel}</Text>
                        {hasReasoningHistory && (
                            <View style={styles.ml2}>
                                <Icon
                                    src={isExpanded ? icons.DownArrow : icons.UpArrow}
                                    fill={theme.icon}
                                    width={variables.iconSizeXXSmall}
                                    height={variables.iconSizeXXSmall}
                                />
                            </View>
                        )}
                    </View>
                </PressableWithoutFeedback>

                {/* Expanded Reasoning History */}
                {isExpanded && hasReasoningHistory && (
                    <View style={[styles.mt4, styles.borderLeft, styles.pl4, styles.ml1, {borderLeftWidth: 2}]}>
                        {reasoningHistory?.map((entry, index) => {
                            return (
                                <View
                                    key={`reasoning-${entry.timestamp}-${entry.loopCount}`}
                                    style={[index < historyLength - 1 ? styles.mb4 : styles.mb0]}
                                >
                                    <RenderHTML html={`<comment><muted-text>${Parser.replace(entry.reasoning)}</muted-text></comment>`} />
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>
        </View>
    );
}

export default ConciergeThinkingMessage;
