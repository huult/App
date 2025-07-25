import {Str} from 'expensify-common';
import React, {useCallback} from 'react';
import FormProvider from '@components/Form/FormProvider';
import InputWrapper from '@components/Form/InputWrapper';
import type {FormInputErrors, FormOnyxValues} from '@components/Form/types';
import Text from '@components/Text';
import TextInput from '@components/TextInput';
import useLocalize from '@hooks/useLocalize';
import useOnyx from '@hooks/useOnyx';
import usePolicy from '@hooks/usePolicy';
import useThemeStyles from '@hooks/useThemeStyles';
import {getFieldRequiredErrors} from '@libs/ValidationUtils';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import INPUT_IDS from '@src/types/form/ReimbursementAccountForm';

type EnterEmailProps = {
    /** Callback when the form is submitted */
    onSubmit: () => void;

    /** Whether the user is a director */
    isUserDirector: boolean;
};

const {COMPANY_NAME, SIGNER_EMAIL, SECOND_SIGNER_EMAIL} = INPUT_IDS.ADDITIONAL_DATA.CORPAY;

function EnterEmail({onSubmit, isUserDirector}: EnterEmailProps) {
    const {translate} = useLocalize();
    const styles = useThemeStyles();

    const [reimbursementAccount] = useOnyx(ONYXKEYS.REIMBURSEMENT_ACCOUNT, {canBeMissing: false});
    const policyID = reimbursementAccount?.achData?.policyID;
    const policy = usePolicy(policyID);
    const currency = policy?.outputCurrency ?? '';
    const shouldGatherBothEmails = currency === CONST.CURRENCY.AUD && !isUserDirector;
    const companyName = reimbursementAccount?.achData?.corpay?.[COMPANY_NAME] ?? '';

    const validate = useCallback(
        (values: FormOnyxValues<typeof ONYXKEYS.FORMS.REIMBURSEMENT_ACCOUNT_FORM>): FormInputErrors<typeof ONYXKEYS.FORMS.REIMBURSEMENT_ACCOUNT_FORM> => {
            const errors = getFieldRequiredErrors(values, shouldGatherBothEmails ? [SIGNER_EMAIL, SECOND_SIGNER_EMAIL] : [SIGNER_EMAIL]);
            if (values[SIGNER_EMAIL] && !Str.isValidEmail(values[SIGNER_EMAIL])) {
                errors[SIGNER_EMAIL] = translate('bankAccount.error.email');
            }

            if (shouldGatherBothEmails && values[SECOND_SIGNER_EMAIL] && !Str.isValidEmail(String(values[SECOND_SIGNER_EMAIL]))) {
                errors[SECOND_SIGNER_EMAIL] = translate('bankAccount.error.email');
            }

            return errors;
        },
        [shouldGatherBothEmails, translate],
    );

    return (
        <FormProvider
            formID={ONYXKEYS.FORMS.REIMBURSEMENT_ACCOUNT_FORM}
            submitButtonText={translate('common.next')}
            onSubmit={onSubmit}
            validate={validate}
            style={[styles.mh5, styles.flexGrow1]}
            shouldHideFixErrorsAlert={!shouldGatherBothEmails}
        >
            <Text style={[styles.textHeadlineLineHeightXXL]}>{translate(shouldGatherBothEmails ? 'signerInfoStep.enterTwoEmails' : 'signerInfoStep.enterOneEmail', {companyName})}</Text>
            {!shouldGatherBothEmails && <Text style={[styles.pv3, styles.textSupporting]}>{translate('signerInfoStep.regulationRequiresOneMoreDirector')}</Text>}
            <InputWrapper
                InputComponent={TextInput}
                label={shouldGatherBothEmails ? `${translate('common.email')} 1` : translate('common.email')}
                aria-label={shouldGatherBothEmails ? `${translate('common.email')} 1` : translate('common.email')}
                role={CONST.ROLE.PRESENTATION}
                inputID={SIGNER_EMAIL}
                inputMode={CONST.INPUT_MODE.EMAIL}
                containerStyles={[styles.mt6]}
            />
            {shouldGatherBothEmails && (
                <InputWrapper
                    InputComponent={TextInput}
                    label={`${translate('common.email')} 2`}
                    aria-label={`${translate('common.email')} 2`}
                    role={CONST.ROLE.PRESENTATION}
                    inputID={SECOND_SIGNER_EMAIL}
                    inputMode={CONST.INPUT_MODE.EMAIL}
                    containerStyles={[styles.mt6]}
                />
            )}
        </FormProvider>
    );
}

EnterEmail.displayName = 'EnterEmail';

export default EnterEmail;
