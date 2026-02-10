import React, {useState} from 'react';
import {View} from 'react-native';
import Avatar from '@components/Avatar';
import RenderHTML from '@components/RenderHTML';
import ExpandCollapseArrowButton from '@components/SelectionListWithSections/Search/ExpandCollapseArrowButton';
import Text from '@components/Text';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import type {ReasoningEntry} from '@libs/ConciergeReasoningStore';
import DateUtils from '@libs/DateUtils';
import CONST from '@src/CONST';

type ConciergeThinkingMessageProps = {
    reasoningHistory?: ReasoningEntry[];
    statusLabel?: string;
};

function ConciergeThinkingMessage({reasoningHistory = [], statusLabel = ''}: ConciergeThinkingMessageProps) {
    const styles = useThemeStyles();
    const {datetimeToCalendarTime} = useLocalize();
    const [isExpanded, setIsExpanded] = useState(false);

    const hasReasoningHistory = reasoningHistory.length > 0;
    const currentTimestamp = DateUtils.getDBTime();

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <View style={[styles.chatItem, styles.pb3]}>
            <View style={[styles.alignSelfStart, styles.mr3]}>
                <Avatar
                    source={CONST.CONCIERGE_ICON_URL}
                    size={CONST.AVATAR_SIZE.DEFAULT}
                    name="Concierge"
                    type={CONST.ICON_TYPE_AVATAR}
                    containerStyles={[styles.actionAvatar]}
                />
            </View>
            <View style={[styles.chatItemRight]}>
                <View style={[styles.chatItemMessageHeader]}>
                    <View style={[styles.flexShrink1, styles.mr1]}>
                        <Text style={[styles.chatItemMessageHeaderSender]}>Concierge</Text>
                    </View>
                    <Text style={[styles.chatItemMessageHeaderTimestamp]}>{datetimeToCalendarTime(currentTimestamp, false, false)}</Text>
                </View>

                <View style={[styles.chatItemMessage]}>
                    {hasReasoningHistory ? (
                        <View style={[styles.flexRow, styles.alignItemsCenter, styles.gap1]}>
                            <ExpandCollapseArrowButton
                                isExpanded={isExpanded}
                                onPress={toggleExpanded}
                            />
                            <Text
                                style={[styles.colorMuted, styles.flex1]}
                                suppressHighlighting
                                onPress={toggleExpanded}
                            >
                                {statusLabel}
                            </Text>
                        </View>
                    ) : (
                        <Text style={[styles.colorMuted]}>{statusLabel}</Text>
                    )}

                    {isExpanded && hasReasoningHistory && (
                        <View style={[styles.mt2, styles.gap2]}>
                            {reasoningHistory.map((entry, index) => (
                                <View
                                    // eslint-disable-next-line react/no-array-index-key
                                    key={`reasoning-${entry.timestamp}-${index}`}
                                    style={[styles.pl3, styles.borderLeft, styles.gap1]}
                                >
                                    <Text style={[styles.textMicroSupporting, styles.colorMuted]}>Loop {entry.loopCount}</Text>
                                    <RenderHTML html={`<comment>${entry.reasoning}</comment>`} />
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
}

export default ConciergeThinkingMessage;
export type {ConciergeThinkingMessageProps};
