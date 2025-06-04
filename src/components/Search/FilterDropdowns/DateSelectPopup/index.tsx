import {isBefore} from 'date-fns';
import React, {useCallback, useState} from 'react';
import useLocalize from '@hooks/useLocalize';
import type {SearchDateModifier} from '@libs/SearchUIUtils';
import CONST from '@src/CONST';
import CalendarView from './CalendarView';
import RootView from './RootView';

type DateSelectPopupValue = Record<SearchDateModifier, string | null>;

type DateSelectPopupProps = {
    /** The current value of the date */
    value: DateSelectPopupValue;

    /** Function to call to close the overlay when changes are applied */
    closeOverlay: () => void;

    /** Function to call when changes are applied */
    onChange: (value: DateSelectPopupValue) => void;
};

function DateSelectPopup({value, closeOverlay, onChange}: DateSelectPopupProps) {
    const [localDateValues, setLocalDateValues] = useState(value);
    const [view, setView] = useState<SearchDateModifier | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const {translate} = useLocalize();

    const validateDates = useCallback(
        (newDateValues: DateSelectPopupValue) => {
            const {BEFORE, AFTER} = CONST.SEARCH.DATE_MODIFIERS;
            const beforeDate = newDateValues[BEFORE];
            const afterDate = newDateValues[AFTER];

            if (beforeDate && afterDate && isBefore(new Date(afterDate), new Date(beforeDate))) {
                setErrorMessage(translate('search.dateSelectPopup.errorMessage'));
                return false;
            }
            setErrorMessage(null); // Clear any error message if validation passes
            return true;
        },
        [translate],
    );

    const setDateValue = (key: SearchDateModifier, dateValue: string | null) => {
        setLocalDateValues((currentValue) => {
            const updatedValue = {
                ...currentValue,
                [key]: dateValue,
            };
            // Validate after each date change
            validateDates(updatedValue);
            return updatedValue;
        });
    };

    const navigateToRootView = useCallback(() => {
        setView(null);
    }, []);

    const resetChanges = useCallback(() => {
        closeOverlay();
        onChange({
            [CONST.SEARCH.DATE_MODIFIERS.ON]: null,
            [CONST.SEARCH.DATE_MODIFIERS.BEFORE]: null,
            [CONST.SEARCH.DATE_MODIFIERS.AFTER]: null,
        });
        setErrorMessage(null); // Clear any errors when reset
    }, [closeOverlay, onChange]);

    const applyChanges = useCallback(() => {
        if (!validateDates(localDateValues)) {
            return; // If validation fails, do not apply changes
        }
        closeOverlay();
        onChange(localDateValues);
    }, [closeOverlay, localDateValues, onChange, validateDates]);

    if (!view) {
        return (
            <RootView
                value={localDateValues}
                applyChanges={applyChanges}
                resetChanges={resetChanges}
                setView={setView}
                errorMessage={errorMessage} // Pass error message to RootView
            />
        );
    }

    return (
        <CalendarView
            view={view}
            value={localDateValues[view]}
            navigateBack={navigateToRootView}
            setValue={setDateValue}
        />
    );
}

DateSelectPopup.displayName = 'DateSelectPopup';
export type {DateSelectPopupValue};
export default DateSelectPopup;
