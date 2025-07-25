import React, {useCallback, useMemo, useState} from 'react';
import {InteractionManager, View} from 'react-native';
import Button from '@components/Button';
import ButtonWithDropdownMenu from '@components/ButtonWithDropdownMenu';
import type {DropdownOption} from '@components/ButtonWithDropdownMenu/types';
import ConfirmModal from '@components/ConfirmModal';
import EmptyStateComponent from '@components/EmptyStateComponent';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import * as Expensicons from '@components/Icon/Expensicons';
import * as Illustrations from '@components/Icon/Illustrations';
import ScreenWrapper from '@components/ScreenWrapper';
import ScrollView from '@components/ScrollView';
import SearchBar from '@components/SearchBar';
import TableListItem from '@components/SelectionList/TableListItem';
import type {ListItem} from '@components/SelectionList/types';
import SelectionListWithModal from '@components/SelectionListWithModal';
import CustomListHeader from '@components/SelectionListWithModal/CustomListHeader';
import TableListItemSkeleton from '@components/Skeletons/TableRowSkeleton';
import Switch from '@components/Switch';
import Text from '@components/Text';
import useLocalize from '@hooks/useLocalize';
import useMobileSelectionMode from '@hooks/useMobileSelectionMode';
import useOnyx from '@hooks/useOnyx';
import useResponsiveLayout from '@hooks/useResponsiveLayout';
import useSearchBackPress from '@hooks/useSearchBackPress';
import useSearchResults from '@hooks/useSearchResults';
import useThemeStyles from '@hooks/useThemeStyles';
import {turnOffMobileSelectionMode} from '@libs/actions/MobileSelectionMode';
import {
    deleteReportFieldsListValue,
    removeReportFieldListValue,
    setReportFieldsListValueEnabled,
    updateReportFieldListValueEnabled as updateReportFieldListValueEnabledReportField,
} from '@libs/actions/Policy/ReportField';
import {canUseTouchScreen} from '@libs/DeviceCapabilities';
import Navigation from '@libs/Navigation/Navigation';
import type {PlatformStackScreenProps} from '@libs/Navigation/PlatformStackNavigation/types';
import {hasAccountingConnections as hasAccountingConnectionsPolicyUtils} from '@libs/PolicyUtils';
import {getReportFieldKey} from '@libs/ReportUtils';
import StringUtils from '@libs/StringUtils';
import type {SettingsNavigatorParamList} from '@navigation/types';
import AccessOrNotFoundWrapper from '@pages/workspace/AccessOrNotFoundWrapper';
import type {WithPolicyAndFullscreenLoadingProps} from '@pages/workspace/withPolicyAndFullscreenLoading';
import withPolicyAndFullscreenLoading from '@pages/workspace/withPolicyAndFullscreenLoading';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import type SCREENS from '@src/SCREENS';
import type DeepValueOf from '@src/types/utils/DeepValueOf';

type ValueListItem = ListItem & {
    /** The value */
    value: string;

    /** Whether the value is enabled */
    enabled: boolean;

    /** The value order weight in the list */
    orderWeight?: number;
};

type ReportFieldsListValuesPageProps = WithPolicyAndFullscreenLoadingProps & PlatformStackScreenProps<SettingsNavigatorParamList, typeof SCREENS.WORKSPACE.REPORT_FIELDS_LIST_VALUES>;

function ReportFieldsListValuesPage({
    policy,
    route: {
        params: {policyID, reportFieldID},
    },
}: ReportFieldsListValuesPageProps) {
    const styles = useThemeStyles();
    const {translate, localeCompare} = useLocalize();
    // We need to use isSmallScreenWidth instead of shouldUseNarrowLayout here to use the mobile selection mode on small screens only
    // See https://github.com/Expensify/App/issues/48724 for more details
    // eslint-disable-next-line rulesdir/prefer-shouldUseNarrowLayout-instead-of-isSmallScreenWidth
    const {isSmallScreenWidth} = useResponsiveLayout();
    const [formDraft] = useOnyx(ONYXKEYS.FORMS.WORKSPACE_REPORT_FIELDS_FORM_DRAFT, {canBeMissing: true});
    const isMobileSelectionModeEnabled = useMobileSelectionMode();

    const [selectedValues, setSelectedValues] = useState<Record<string, boolean>>({});
    const [deleteValuesConfirmModalVisible, setDeleteValuesConfirmModalVisible] = useState(false);
    const hasAccountingConnections = hasAccountingConnectionsPolicyUtils(policy);

    const canSelectMultiple = !hasAccountingConnections && (isSmallScreenWidth ? isMobileSelectionModeEnabled : true);

    const [listValues, disabledListValues] = useMemo(() => {
        let reportFieldValues: string[];
        let reportFieldDisabledValues: boolean[];

        if (reportFieldID) {
            const reportFieldKey = getReportFieldKey(reportFieldID);

            reportFieldValues = Object.values(policy?.fieldList?.[reportFieldKey]?.values ?? {});
            reportFieldDisabledValues = Object.values(policy?.fieldList?.[reportFieldKey]?.disabledOptions ?? {});
        } else {
            reportFieldValues = formDraft?.listValues ?? [];
            reportFieldDisabledValues = formDraft?.disabledListValues ?? [];
        }

        return [reportFieldValues, reportFieldDisabledValues];
    }, [formDraft?.disabledListValues, formDraft?.listValues, policy?.fieldList, reportFieldID]);

    const updateReportFieldListValueEnabled = useCallback(
        (value: boolean, valueIndex: number) => {
            if (reportFieldID) {
                updateReportFieldListValueEnabledReportField(policyID, reportFieldID, [Number(valueIndex)], value);
                return;
            }

            setReportFieldsListValueEnabled([valueIndex], value);
        },
        [policyID, reportFieldID],
    );

    useSearchBackPress({
        onClearSelection: () => {
            setSelectedValues({});
        },
        onNavigationCallBack: () => Navigation.goBack(),
    });

    const data = useMemo(
        () =>
            listValues.map<ValueListItem>((value, index) => ({
                value,
                index,
                text: value,
                keyForList: value,
                isSelected: selectedValues[value] && canSelectMultiple,
                enabled: !disabledListValues.at(index) ?? true,
                rightElement: (
                    <Switch
                        isOn={!disabledListValues.at(index) ?? true}
                        accessibilityLabel={translate('workspace.distanceRates.trackTax')}
                        onToggle={(newValue: boolean) => updateReportFieldListValueEnabled(newValue, index)}
                    />
                ),
            })),
        [canSelectMultiple, disabledListValues, listValues, selectedValues, translate, updateReportFieldListValueEnabled],
    );

    const filterListValue = useCallback((item: ValueListItem, searchInput: string) => {
        const itemText = StringUtils.normalize(item.text?.toLowerCase() ?? '');
        const normalizedSearchInput = StringUtils.normalize(searchInput.toLowerCase());
        return itemText.includes(normalizedSearchInput);
    }, []);
    const sortListValues = useCallback((values: ValueListItem[]) => values.sort((a, b) => localeCompare(a.value, b.value)), [localeCompare]);
    const [inputValue, setInputValue, filteredListValues] = useSearchResults(data, filterListValue, sortListValues);
    const sections = useMemo(() => [{data: filteredListValues, isDisabled: false}], [filteredListValues]);

    const filteredListValuesArray = filteredListValues.map((item) => item.value);

    const shouldShowEmptyState = Object.values(listValues ?? {}).length <= 0;
    const selectedValuesArray = Object.keys(selectedValues).filter((key) => selectedValues[key] && listValues.includes(key));

    const toggleValue = (valueItem: ValueListItem) => {
        setSelectedValues((prev) => ({
            ...prev,
            [valueItem.value]: !prev[valueItem.value],
        }));
    };

    const toggleAllValues = () => {
        setSelectedValues(selectedValuesArray.length > 0 ? {} : Object.fromEntries(filteredListValuesArray.map((value) => [value, true])));
    };

    const handleDeleteValues = () => {
        const valuesToDelete = selectedValuesArray.reduce<number[]>((acc, valueName) => {
            const index = listValues?.indexOf(valueName) ?? -1;

            if (index !== -1) {
                acc.push(index);
            }

            return acc;
        }, []);

        if (reportFieldID) {
            removeReportFieldListValue(policyID, reportFieldID, valuesToDelete);
        } else {
            deleteReportFieldsListValue(valuesToDelete);
        }

        setDeleteValuesConfirmModalVisible(false);

        InteractionManager.runAfterInteractions(() => {
            setSelectedValues({});
        });
    };

    const openListValuePage = (valueItem: ValueListItem) => {
        if (valueItem.index === undefined || hasAccountingConnections) {
            return;
        }

        Navigation.navigate(ROUTES.WORKSPACE_REPORT_FIELDS_VALUE_SETTINGS.getRoute(policyID, valueItem.index, reportFieldID));
    };

    const getCustomListHeader = () => {
        if (filteredListValues.length === 0) {
            return null;
        }
        return (
            <CustomListHeader
                canSelectMultiple={canSelectMultiple}
                leftHeaderText={translate('common.name')}
                rightHeaderText={translate('common.enabled')}
            />
        );
    };

    const getHeaderButtons = () => {
        const options: Array<DropdownOption<DeepValueOf<typeof CONST.POLICY.BULK_ACTION_TYPES>>> = [];
        if (isSmallScreenWidth ? isMobileSelectionModeEnabled : selectedValuesArray.length > 0) {
            if (selectedValuesArray.length > 0) {
                options.push({
                    icon: Expensicons.Trashcan,
                    text: translate(selectedValuesArray.length === 1 ? 'workspace.reportFields.deleteValue' : 'workspace.reportFields.deleteValues'),
                    value: CONST.POLICY.BULK_ACTION_TYPES.DELETE,
                    onSelected: () => setDeleteValuesConfirmModalVisible(true),
                });
            }
            const enabledValues = selectedValuesArray.filter((valueName) => {
                const index = listValues?.indexOf(valueName) ?? -1;
                return !disabledListValues?.at(index);
            });

            if (enabledValues.length > 0) {
                const valuesToDisable = selectedValuesArray.reduce<number[]>((acc, valueName) => {
                    const index = listValues?.indexOf(valueName) ?? -1;
                    if (!disabledListValues?.at(index) && index !== -1) {
                        acc.push(index);
                    }

                    return acc;
                }, []);

                options.push({
                    icon: Expensicons.Close,
                    text: translate(enabledValues.length === 1 ? 'workspace.reportFields.disableValue' : 'workspace.reportFields.disableValues'),
                    value: CONST.POLICY.BULK_ACTION_TYPES.DISABLE,
                    onSelected: () => {
                        setSelectedValues({});

                        if (reportFieldID) {
                            updateReportFieldListValueEnabledReportField(policyID, reportFieldID, valuesToDisable, false);
                            return;
                        }

                        setReportFieldsListValueEnabled(valuesToDisable, false);
                    },
                });
            }

            const disabledValues = selectedValuesArray.filter((valueName) => {
                const index = listValues?.indexOf(valueName) ?? -1;
                return disabledListValues?.at(index);
            });

            if (disabledValues.length > 0) {
                const valuesToEnable = selectedValuesArray.reduce<number[]>((acc, valueName) => {
                    const index = listValues?.indexOf(valueName) ?? -1;
                    if (disabledListValues?.at(index) && index !== -1) {
                        acc.push(index);
                    }

                    return acc;
                }, []);

                options.push({
                    icon: Expensicons.Checkmark,
                    text: translate(disabledValues.length === 1 ? 'workspace.reportFields.enableValue' : 'workspace.reportFields.enableValues'),
                    value: CONST.POLICY.BULK_ACTION_TYPES.ENABLE,
                    onSelected: () => {
                        setSelectedValues({});

                        if (reportFieldID) {
                            updateReportFieldListValueEnabledReportField(policyID, reportFieldID, valuesToEnable, true);
                            return;
                        }

                        setReportFieldsListValueEnabled(valuesToEnable, true);
                    },
                });
            }

            return (
                <ButtonWithDropdownMenu
                    onPress={() => null}
                    shouldAlwaysShowDropdownMenu
                    buttonSize={CONST.DROPDOWN_BUTTON_SIZE.MEDIUM}
                    customText={translate('workspace.common.selected', {count: selectedValuesArray.length})}
                    options={options}
                    isSplitButton={false}
                    style={[isSmallScreenWidth && styles.flexGrow1, isSmallScreenWidth && styles.mb3]}
                    isDisabled={!selectedValuesArray.length}
                />
            );
        }

        return (
            <Button
                style={[isSmallScreenWidth && styles.flexGrow1, isSmallScreenWidth && styles.mb3]}
                success
                icon={Expensicons.Plus}
                text={translate('workspace.reportFields.addValue')}
                onPress={() => Navigation.navigate(ROUTES.WORKSPACE_REPORT_FIELDS_ADD_VALUE.getRoute(policyID, reportFieldID))}
            />
        );
    };

    const selectionModeHeader = isMobileSelectionModeEnabled && isSmallScreenWidth;

    const headerContent = (
        <>
            <View style={[styles.ph5, styles.pv4]}>
                <Text style={[styles.sidebarLinkText, styles.optionAlternateText]}>{translate('workspace.reportFields.listInputSubtitle')}</Text>
            </View>
            {data.length > CONST.SEARCH_ITEM_LIMIT && (
                <SearchBar
                    label={translate('workspace.reportFields.findReportField')}
                    inputValue={inputValue}
                    onChangeText={setInputValue}
                    shouldShowEmptyState={!shouldShowEmptyState && filteredListValues.length === 0}
                />
            )}
        </>
    );

    return (
        <AccessOrNotFoundWrapper
            accessVariants={[CONST.POLICY.ACCESS_VARIANTS.ADMIN, CONST.POLICY.ACCESS_VARIANTS.PAID]}
            policyID={policyID}
            featureName={CONST.POLICY.MORE_FEATURES.ARE_REPORT_FIELDS_ENABLED}
        >
            <ScreenWrapper
                enableEdgeToEdgeBottomSafeAreaPadding
                style={styles.defaultModalContainer}
                testID={ReportFieldsListValuesPage.displayName}
                shouldEnableMaxHeight
            >
                <HeaderWithBackButton
                    title={translate(selectionModeHeader ? 'common.selectMultiple' : 'workspace.reportFields.listValues')}
                    onBackButtonPress={() => {
                        if (isMobileSelectionModeEnabled) {
                            setSelectedValues({});
                            turnOffMobileSelectionMode();
                            return;
                        }
                        Navigation.goBack();
                    }}
                >
                    {!isSmallScreenWidth && !hasAccountingConnections && getHeaderButtons()}
                </HeaderWithBackButton>
                {isSmallScreenWidth && <View style={[styles.pl5, styles.pr5]}>{!hasAccountingConnections && getHeaderButtons()}</View>}
                {shouldShowEmptyState && (
                    <ScrollView contentContainerStyle={[styles.flexGrow1, styles.flexShrink0]}>
                        {headerContent}
                        <EmptyStateComponent
                            title={translate('workspace.reportFields.emptyReportFieldsValues.title')}
                            subtitle={translate('workspace.reportFields.emptyReportFieldsValues.subtitle')}
                            SkeletonComponent={TableListItemSkeleton}
                            headerMediaType={CONST.EMPTY_STATE_MEDIA.ILLUSTRATION}
                            headerMedia={Illustrations.FolderWithPapers}
                            headerStyles={styles.emptyFolderDarkBG}
                            headerContentStyles={styles.emptyStateFolderWithPaperIconSize}
                        />
                    </ScrollView>
                )}
                {!shouldShowEmptyState && (
                    <SelectionListWithModal
                        addBottomSafeAreaPadding
                        canSelectMultiple={canSelectMultiple}
                        turnOnSelectionModeOnLongPress={!hasAccountingConnections}
                        onTurnOnSelectionMode={(item) => item && toggleValue(item)}
                        sections={sections}
                        selectedItems={selectedValuesArray}
                        shouldUseDefaultRightHandSideCheckmark={false}
                        onCheckboxPress={toggleValue}
                        onSelectRow={openListValuePage}
                        onSelectAll={filteredListValues.length > 0 ? toggleAllValues : undefined}
                        ListItem={TableListItem}
                        listHeaderContent={headerContent}
                        customListHeader={getCustomListHeader()}
                        shouldShowListEmptyContent={false}
                        shouldPreventDefaultFocusOnSelectRow={!canUseTouchScreen()}
                        listHeaderWrapperStyle={[styles.ph9, styles.pv3, styles.pb5]}
                        showScrollIndicator={false}
                    />
                )}
                <ConfirmModal
                    isVisible={deleteValuesConfirmModalVisible}
                    onConfirm={handleDeleteValues}
                    onCancel={() => setDeleteValuesConfirmModalVisible(false)}
                    title={translate(selectedValuesArray.length === 1 ? 'workspace.reportFields.deleteValue' : 'workspace.reportFields.deleteValues')}
                    prompt={translate(selectedValuesArray.length === 1 ? 'workspace.reportFields.deleteValuePrompt' : 'workspace.reportFields.deleteValuesPrompt')}
                    confirmText={translate('common.delete')}
                    cancelText={translate('common.cancel')}
                    danger
                />
            </ScreenWrapper>
        </AccessOrNotFoundWrapper>
    );
}

ReportFieldsListValuesPage.displayName = 'ReportFieldsListValuesPage';

export default withPolicyAndFullscreenLoading(ReportFieldsListValuesPage);
