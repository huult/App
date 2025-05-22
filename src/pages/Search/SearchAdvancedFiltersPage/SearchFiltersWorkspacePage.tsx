import React, {useCallback, useMemo, useState} from 'react';
import {useOnyx} from 'react-native-onyx';
import Button from '@components/Button';
import FullScreenLoadingIndicator from '@components/FullscreenLoadingIndicator';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import ScreenWrapper from '@components/ScreenWrapper';
import SelectionList from '@components/SelectionList';
import UserListItem from '@components/SelectionList/UserListItem';
import useDebouncedState from '@hooks/useDebouncedState';
import useLocalize from '@hooks/useLocalize';
import useNetwork from '@hooks/useNetwork';
import useThemeStyles from '@hooks/useThemeStyles';
import type {WorkspaceListItem} from '@hooks/useWorkspaceList';
import useWorkspaceList from '@hooks/useWorkspaceList';
import {updateAdvancedFilters} from '@libs/actions/Search';
import Navigation from '@libs/Navigation/Navigation';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import isLoadingOnyxValue from '@src/types/utils/isLoadingOnyxValue';

const updateWorkspaceFilter = (policyIDs: string[]) => {
    console.log('****** policyIDs ******', policyIDs);

    // updateAdvancedFilters({
    //     policyIDs, // key changed from `policyID` → `policyIDs` (array)
    // });
    // Navigation.goBack(ROUTES.SEARCH_ADVANCED_FILTERS);
};

function WrapUserListItem({...props}: WorkspaceListItem) {
    return (
        <UserListItem
            {...props}
            shouldShowRightSelect
        />
    );
}

// Update SearchFiltersWorkspacePage to able to multiple select

function SearchFiltersWorkspacePage() {
    const styles = useThemeStyles();
    const {translate} = useLocalize();
    const {isOffline} = useNetwork();

    const [searchAdvancedFiltersForm] = useOnyx(ONYXKEYS.FORMS.SEARCH_ADVANCED_FILTERS_FORM);
    const [policies, policiesResult] = useOnyx(ONYXKEYS.COLLECTION.POLICY);
    const [currentUserLogin] = useOnyx(ONYXKEYS.SESSION, {selector: (session) => session?.email});
    const [isLoadingApp] = useOnyx(ONYXKEYS.IS_LOADING_APP);
    const [searchTerm, debouncedSearchTerm, setSearchTerm] = useDebouncedState('');
    const shouldShowLoadingIndicator = isLoadingApp && !isOffline;
    const [selectedPolicyIDs, setSelectedPolicyIDs] = useState<string[]>(searchAdvancedFiltersForm?.policyIDS ?? []);

    const {sections, shouldShowNoResultsFoundMessage, shouldShowSearchInput} = useWorkspaceList({
        policies,
        currentUserLogin,
        shouldShowPendingDeletePolicy: false,
        selectedPolicyID: selectedPolicyIDs,
        searchTerm: debouncedSearchTerm,
    });

    const handleConfirmSelection = useCallback(() => {
        updateAdvancedFilters({
            policyIDS: selectedPolicyIDs, // key changed from `policyID` → `policyIDs` (array)
        });
        Navigation.goBack(ROUTES.SEARCH_ADVANCED_FILTERS);
    }, [selectedPolicyIDs]);

    const footerContent = useMemo(
        () => (
            <>
                <Button
                    text={translate('search.resetFilters')}
                    onPress={() => {
                        setSelectedPolicyIDs([]);
                    }}
                    large
                />
                <Button
                    success
                    style={[styles.mt4]}
                    text={translate('common.save')}
                    pressOnEnter
                    onPress={handleConfirmSelection}
                    large
                />
            </>
        ),
        [translate, handleConfirmSelection, styles.mt4],
    );

    return (
        <ScreenWrapper
            testID={SearchFiltersWorkspacePage.displayName}
            includeSafeAreaPaddingBottom
            shouldShowOfflineIndicatorInWideScreen
            offlineIndicatorStyle={styles.mtAuto}
            shouldEnableMaxHeight
        >
            {({didScreenTransitionEnd}) => (
                <>
                    <HeaderWithBackButton
                        title={translate('workspace.common.workspace')}
                        onBackButtonPress={() => {
                            Navigation.goBack(ROUTES.SEARCH_ADVANCED_FILTERS);
                        }}
                    />
                    {shouldShowLoadingIndicator ? (
                        <FullScreenLoadingIndicator style={[styles.flex1, styles.pRelative]} />
                    ) : (
                        <SelectionList<WorkspaceListItem>
                            ListItem={WrapUserListItem}
                            sections={sections}
                            onSelectRow={(option) => {
                                if (!option.policyID) {
                                    return;
                                }

                                setSelectedPolicyIDs((prev) => {
                                    const isAlreadySelected = prev.includes(option?.policyID!); // option.policyID is known to be defined here
                                    const updated = isAlreadySelected ? prev.filter((id) => id !== option.policyID) : [...prev, option.policyID];

                                    return updated;
                                });
                            }}
                            textInputLabel={shouldShowSearchInput ? translate('common.search') : undefined}
                            textInputValue={searchTerm}
                            onChangeText={setSearchTerm}
                            headerMessage={shouldShowNoResultsFoundMessage ? translate('common.noResultsFound') : ''}
                            initiallyFocusedOptionKey={searchAdvancedFiltersForm?.policyID}
                            showLoadingPlaceholder={isLoadingOnyxValue(policiesResult) || !didScreenTransitionEnd}
                            footerContent={footerContent}
                            canSelectMultiple
                        />
                    )}
                </>
            )}
        </ScreenWrapper>
    );
}

SearchFiltersWorkspacePage.displayName = 'SearchFiltersWorkspacePage';

export default SearchFiltersWorkspacePage;
