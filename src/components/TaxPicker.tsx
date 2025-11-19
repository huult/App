import React, {useCallback, useMemo, useState} from 'react';
import type {ValueOf} from 'type-fest';
import useLocalize from '@hooks/useLocalize';
import useOnyx from '@hooks/useOnyx';
import {shouldUseTransactionDraft} from '@libs/IOUUtils';
import Navigation from '@libs/Navigation/Navigation';
import {getHeaderMessageForNonUserList} from '@libs/OptionsListUtils';
import {getTaxByID} from '@libs/PolicyUtils';
import {getTaxRatesSection} from '@libs/TaxOptionsListUtils';
import type {Tax, TaxRatesOption} from '@libs/TaxOptionsListUtils';
import {getEnabledTaxRateCount} from '@libs/TransactionUtils';
import {isValidTaxID} from '@libs/ValidationUtils';
import CONST from '@src/CONST';
import type {IOUAction} from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import {isEmptyObject} from '@src/types/utils/EmptyObject';
import SelectionList from './SelectionListWithSections';
import RadioListItem from './SelectionListWithSections/RadioListItem';

type TaxPickerProps = {
    /** The selected tax rate of an expense */
    selectedTaxRate?: string;

    /** ID of the policy */
    policyID?: string;

    /** ID of the transaction */
    transactionID?: string;

    /** Callback to fire when a tax is pressed */
    onSubmit: (tax: TaxRatesOption) => void;

    /** The action to take */
    action?: IOUAction;

    /** The type of IOU */
    iouType?: ValueOf<typeof CONST.IOU.TYPE>;

    onDismiss: () => void;

    /**
     * If enabled, the content will have a bottom padding equal to account for the safe bottom area inset.
     */
    addBottomSafeAreaPadding?: boolean;
};

function TaxPicker({selectedTaxRate = '', policyID, transactionID, onSubmit, action, iouType, onDismiss = Navigation.goBack, addBottomSafeAreaPadding}: TaxPickerProps) {
    const {translate, localeCompare} = useLocalize();
    const [searchValue, setSearchValue] = useState('');
    const [splitDraftTransaction] = useOnyx(`${ONYXKEYS.COLLECTION.SPLIT_TRANSACTION_DRAFT}${transactionID}`, {canBeMissing: true});

    const [policy] = useOnyx(`${ONYXKEYS.COLLECTION.POLICY}${policyID}`, {canBeMissing: true});
    const [transaction] = useOnyx(
        (() => {
            if (shouldUseTransactionDraft(action)) {
                return `${ONYXKEYS.COLLECTION.TRANSACTION_DRAFT}${transactionID}` as `${typeof ONYXKEYS.COLLECTION.TRANSACTION}${string}`;
            }
            return `${ONYXKEYS.COLLECTION.TRANSACTION}${transactionID}`;
        })(),
        {canBeMissing: true},
    );

    const taxRateInfo = getTaxByID(policy, transaction?.taxCode ?? '');
    const isTaxValid = taxRateInfo && !taxRateInfo.isDisabled && taxRateInfo.pendingAction !== CONST.RED_BRICK_ROAD_PENDING_ACTION.DELETE;

    const isEditing = action === CONST.IOU.ACTION.EDIT;
    const isEditingSplitBill = isEditing && iouType === CONST.IOU.TYPE.SPLIT;
    const currentTransaction = isEditingSplitBill && !isEmptyObject(splitDraftTransaction) ? splitDraftTransaction : transaction;

    const taxRates = policy?.taxRates;
    const taxRatesCount = getEnabledTaxRateCount(taxRates?.taxes ?? {});
    const isTaxRatesCountBelowThreshold = taxRatesCount < CONST.STANDARD_LIST_ITEM_LIMIT;

    const shouldShowTextInput = !isTaxRatesCountBelowThreshold;

    const selectedOptions = useMemo<Tax[]>(() => {
        if (!selectedTaxRate) {
            return [];
        }

        return [
            {
                modifiedName: selectedTaxRate,
                isDisabled: false,
                accountID: null,
            },
        ];
    }, [selectedTaxRate]);

    const sections = useMemo(() => {
        if (!isTaxValid) {
            const taxRatesSection = getTaxRatesSection({
                policy,
                searchValue,
                localeCompare,
                selectedOptions,
                transaction: currentTransaction,
            });
            return taxRatesSection.map((section) => {
                return {
                    ...section,
                    data: [
                        ...section.data,
                        {
                            code: transaction?.taxCode,
                            text: transaction?.taxValue ?? '',
                            keyForList: transaction?.taxValue ?? '',
                            searchText: transaction?.taxValue ?? '',
                            tooltipText: transaction?.taxValue ?? '',
                            isDisabled: true,
                            isSelected: true,
                        },
                    ],
                };
            });
        }
        return getTaxRatesSection({
            policy,
            searchValue,
            localeCompare,
            selectedOptions,
            transaction: currentTransaction,
        });
    }, [isTaxValid, policy, searchValue, localeCompare, selectedOptions, currentTransaction, transaction?.taxCode, transaction?.taxValue]);

    const headerMessage = getHeaderMessageForNonUserList((sections.at(0)?.data?.length ?? 0) > 0, searchValue);

    const selectedOptionKey = useMemo(() => sections?.at(0)?.data?.find((taxRate) => taxRate.searchText === selectedTaxRate)?.keyForList, [sections, selectedTaxRate]);

    const handleSelectRow = useCallback(
        (newSelectedOption: TaxRatesOption) => {
            if (selectedOptionKey === newSelectedOption.keyForList) {
                onDismiss();
                return;
            }

            if (!isTaxValid) {
                onSubmit({...sections.at(0)?.data[0]});
                return;
            }

            onSubmit(newSelectedOption);
        },
        [selectedOptionKey, isTaxValid, onSubmit, onDismiss, sections],
    );

    return (
        <SelectionList
            sections={sections}
            headerMessage={headerMessage}
            textInputValue={searchValue}
            textInputLabel={shouldShowTextInput ? translate('common.search') : undefined}
            onChangeText={setSearchValue}
            onSelectRow={handleSelectRow}
            ListItem={RadioListItem}
            initiallyFocusedOptionKey={selectedOptionKey ?? undefined}
            isRowMultilineSupported
            addBottomSafeAreaPadding={addBottomSafeAreaPadding}
        />
    );
}

TaxPicker.displayName = 'TaxPicker';

export default TaxPicker;
