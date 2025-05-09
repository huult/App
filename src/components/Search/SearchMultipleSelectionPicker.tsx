import React, {useCallback, useEffect, useMemo, useState} from 'react';
import Button from '@components/Button';
import SelectionList from '@components/SelectionList';
import SelectableListItem from '@components/SelectionList/SelectableListItem';
import useDebouncedState from '@hooks/useDebouncedState';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import localeCompare from '@libs/LocaleCompare';
import Navigation from '@libs/Navigation/Navigation';
import type {OptionData} from '@libs/ReportUtils';
import CONST from '@src/CONST';
import ROUTES from '@src/ROUTES';

type SearchMultipleSelectionPickerItem = {
    name: string;
    value: string | string[];
};

type SearchMultipleSelectionPickerProps = {
    items: SearchMultipleSelectionPickerItem[];
    initiallySelectedItems: SearchMultipleSelectionPickerItem[] | undefined;
    pickerTitle?: string;
    onSaveSelection: (values: string[]) => void;
    shouldShowTextInput?: boolean;
};

function SearchMultipleSelectionPicker({items, initiallySelectedItems, pickerTitle, onSaveSelection, shouldShowTextInput = true}: SearchMultipleSelectionPickerProps) {
    const {translate} = useLocalize();
    const styles = useThemeStyles();

    const [searchTerm, debouncedSearchTerm, setSearchTerm] = useDebouncedState('');
    const [selectedItems, setSelectedItems] = useState<SearchMultipleSelectionPickerItem[]>(initiallySelectedItems ?? []);

    const sortOptionsWithEmptyValue = (a: SearchMultipleSelectionPickerItem, b: SearchMultipleSelectionPickerItem) => {
        // Always show `No category` and `No tag` as the first option
        if (a.value === CONST.SEARCH.EMPTY_VALUE) {
            return -1;
        }
        if (b.value === CONST.SEARCH.EMPTY_VALUE) {
            return 1;
        }
        return localeCompare(a.name, b.name);
    };

    useEffect(() => {
        setSelectedItems(initiallySelectedItems ?? []);
    }, [initiallySelectedItems]);

    const {sections, noResultsFound, firstKeyForList} = useMemo(() => {
        const remainingItemsSection = items
            .filter((item) => item?.name?.toLowerCase().includes(debouncedSearchTerm?.toLowerCase()))
            .sort((a, b) => sortOptionsWithEmptyValue(a, b))
            .map((item) => ({
                text: item.name,
                keyForList: item.name,
                isSelected: selectedItems.some((selectedItem) => selectedItem.value === item.value),
                value: item.value,
            }));

        const isEmpty = !remainingItemsSection.length;

        const firstSelectedItem = remainingItemsSection.find((item) => item.isSelected);
        const firstKey = firstSelectedItem?.keyForList ?? null;

        return {
            sections: isEmpty
                ? []
                : [
                      {
                          title: pickerTitle,
                          data: remainingItemsSection,
                          shouldShow: remainingItemsSection.length > 0,
                      },
                  ],
            noResultsFound: isEmpty,
            firstKeyForList: firstKey,
        };
    }, [selectedItems, items, pickerTitle, debouncedSearchTerm]);

    const onSelectItem = useCallback(
        (item: Partial<OptionData & SearchMultipleSelectionPickerItem>) => {
            if (!item.text || !item.keyForList || !item.value) {
                return;
            }
            if (item.isSelected) {
                setSelectedItems(selectedItems?.filter((selectedItem) => selectedItem.name !== item.keyForList));
            } else {
                setSelectedItems([...(selectedItems ?? []), {name: item.text, value: item.value}]);
            }
        },
        [selectedItems],
    );

    const handleConfirmSelection = useCallback(() => {
        onSaveSelection(selectedItems.map((item) => item.value).flat());
        Navigation.goBack(ROUTES.SEARCH_ADVANCED_FILTERS);
    }, [onSaveSelection, selectedItems]);

    const footerContent = useMemo(
        () => (
            <Button
                success
                style={[styles.mt4]}
                text={translate('common.save')}
                pressOnEnter
                onPress={handleConfirmSelection}
                large
            />
        ),
        [translate, handleConfirmSelection, styles.mt4],
    );

    return (
        <SelectionList
            sections={sections}
            textInputValue={searchTerm}
            onChangeText={setSearchTerm}
            textInputLabel={shouldShowTextInput ? translate('common.search') : undefined}
            onSelectRow={onSelectItem}
            headerMessage={noResultsFound ? translate('common.noResultsFound') : undefined}
            footerContent={footerContent}
            shouldStopPropagation
            showLoadingPlaceholder={!noResultsFound}
            shouldShowTooltips
            canSelectMultiple
            ListItem={SelectableListItem}
            initiallyFocusedOptionKey={firstKeyForList}
        />
    );
}

SearchMultipleSelectionPicker.displayName = 'SearchMultipleSelectionPicker';

export default SearchMultipleSelectionPicker;
export type {SearchMultipleSelectionPickerItem};
