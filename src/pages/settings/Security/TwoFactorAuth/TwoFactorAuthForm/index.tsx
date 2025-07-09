import React from 'react';
import BaseTwoFactorAuthForm from './BaseTwoFactorAuthForm';
import type {TwoFactorAuthFormProps} from './types';

function TwoFactorAuthForm({innerRef, validateInsteadOfDisable, autoFocus = true}: TwoFactorAuthFormProps) {
    return (
        <BaseTwoFactorAuthForm
            ref={innerRef}
            autoComplete="one-time-code"
            validateInsteadOfDisable={validateInsteadOfDisable}
            autoFocus={autoFocus}
        />
    );
}

TwoFactorAuthForm.displayName = 'TwoFactorAuthForm';

export default TwoFactorAuthForm;
