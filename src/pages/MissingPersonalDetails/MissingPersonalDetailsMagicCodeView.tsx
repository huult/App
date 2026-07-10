import ValidateCodeActionContent from '@components/ValidateCodeActionModal/ValidateCodeActionContent';

import useLocalize from '@hooks/useLocalize';
import useOnyx from '@hooks/useOnyx';
import usePrimaryContactMethod from '@hooks/usePrimaryContactMethod';

import {clearDraftValues} from '@libs/actions/FormActions';
import {
    buildSetPersonalDetailsAndShipExpensifyCardsParams,
    clearPersonalDetailsErrors,
    setPersonalDetailsAndRevealExpensifyCard,
    updatePersonalDetailsAndShipExpensifyCards,
} from '@libs/actions/PersonalDetails';
import {requestValidateCodeAction} from '@libs/actions/User';
import {normalizeCountryCode} from '@libs/CountryUtils';
import {getLatestError, getMicroSecondOnyxErrorWithTranslationKey} from '@libs/ErrorUtils';
import Navigation from '@libs/Navigation/Navigation';
import {arePersonalDetailsMissing} from '@libs/PersonalDetailsUtils';
import {setRevealedVirtualCardDetails} from '@libs/RevealedCardSecretsStore';

import CONST from '@src/CONST';
import type {TranslationPaths} from '@src/languages/types';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import type {Route} from '@src/ROUTES';
import type {PersonalDetailsForm} from '@src/types/form';
import type {CardList} from '@src/types/onyx';
import type {Errors} from '@src/types/onyx/OnyxCommon';
import {isEmptyObject} from '@src/types/utils/EmptyObject';

import type {OnyxEntry} from 'react-native-onyx';

import {areAllExpensifyCardsShipped} from '@selectors/Card';
import React, {useCallback, useEffect, useMemo, useState} from 'react';

import {getSubPageValues} from './utils';

type MissingPersonalDetailsMagicCodeViewProps = {
    /** Card ID for the card that the user is adding personal details to */
    cardID: string;

    /** Builds the route to go back to the missing personal details step. Lets the flow run under either a static or a dynamic (report-scoped) route. */
    getBackRoute: (cardID: string) => Route;
};

function MissingPersonalDetailsMagicCodeView({cardID, getBackRoute}: MissingPersonalDetailsMagicCodeViewProps) {
    const {translate} = useLocalize();
    const [privatePersonalDetails] = useOnyx(ONYXKEYS.PRIVATE_PERSONAL_DETAILS);
    const [draftValues] = useOnyx(ONYXKEYS.FORMS.PERSONAL_DETAILS_FORM_DRAFT);
    const [countryCode = CONST.DEFAULT_COUNTRY_CODE] = useOnyx(ONYXKEYS.COUNTRY_CODE);

    const [areAllCardsShipped] = useOnyx(ONYXKEYS.CARD_LIST, {selector: areAllExpensifyCardsShipped});
    const targetCardSelector = useCallback((cardList: OnyxEntry<CardList>) => (cardID ? cardList?.[cardID] : undefined), [cardID]);
    const [targetCard] = useOnyx(ONYXKEYS.CARD_LIST, {selector: targetCardSelector});
    const isVirtualCard = !!targetCard?.nameValuePairs?.isVirtual;
    const primaryLogin = usePrimaryContactMethod();

    const [validateCodeAction] = useOnyx(ONYXKEYS.VALIDATE_ACTION_CODE);
    const privateDetailsErrors = privatePersonalDetails?.errors ?? undefined;
    const validateLoginError = getLatestError(privateDetailsErrors);
    const [revealCardError, setRevealCardError] = useState<Errors>({});

    const missingDetails = arePersonalDetailsMissing(privatePersonalDetails);

    useEffect(() => {
        if (isVirtualCard || missingDetails || !!privateDetailsErrors || !areAllCardsShipped) {
            return;
        }

        clearDraftValues(ONYXKEYS.FORMS.PERSONAL_DETAILS_FORM);
        Navigation.dismissModal();
    }, [isVirtualCard, missingDetails, privateDetailsErrors, areAllCardsShipped]);

    const clearError = () => {
        setRevealCardError({});
        if (isEmptyObject(validateLoginError) && isEmptyObject(validateCodeAction?.errorFields)) {
            return;
        }
        clearPersonalDetailsErrors();
    };

    const values = useMemo(() => normalizeCountryCode(getSubPageValues(privatePersonalDetails, draftValues)) as PersonalDetailsForm, [privatePersonalDetails, draftValues]);

    const handleSubmitForm = useCallback(
        (validateCode: string) => {
            if (isVirtualCard) {
                setPersonalDetailsAndRevealExpensifyCard(buildSetPersonalDetailsAndShipExpensifyCardsParams(values, countryCode), Number(cardID), validateCode)
                    .then((details) => {
                        setRevealedVirtualCardDetails(cardID, details);
                        clearDraftValues(ONYXKEYS.FORMS.PERSONAL_DETAILS_FORM);
                        Navigation.closeRHPFlow();
                        Navigation.navigate(ROUTES.SETTINGS_WALLET_DOMAIN_CARD.getRoute(cardID));
                    })
                    .catch((error: TranslationPaths) => {
                        setRevealCardError(getMicroSecondOnyxErrorWithTranslationKey(error));
                    });
                return;
            }
            updatePersonalDetailsAndShipExpensifyCards(values, validateCode, countryCode);
        },
        [countryCode, values, isVirtualCard, cardID],
    );

    return (
        <ValidateCodeActionContent
            title={translate('cardPage.validateCardTitle')}
            descriptionPrimary={translate('cardPage.enterMagicCode', primaryLogin ?? '')}
            sendValidateCode={() => requestValidateCodeAction()}
            validateCodeActionErrorField="personalDetails"
            handleSubmitForm={handleSubmitForm}
            validateError={!isEmptyObject(revealCardError) ? revealCardError : validateLoginError}
            clearError={clearError}
            onClose={() => {
                Navigation.goBack(getBackRoute(cardID));
            }}
            isLoading={privatePersonalDetails?.isLoading}
        />
    );
}

export default MissingPersonalDetailsMagicCodeView;
export type {MissingPersonalDetailsMagicCodeViewProps};
