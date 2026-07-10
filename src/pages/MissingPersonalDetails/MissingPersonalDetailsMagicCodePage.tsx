import type {PlatformStackScreenProps} from '@libs/Navigation/PlatformStackNavigation/types';
import type {MissingPersonalDetailsParamList} from '@libs/Navigation/types';

import ROUTES from '@src/ROUTES';
import type SCREENS from '@src/SCREENS';

import React from 'react';

import MissingPersonalDetailsMagicCodeView from './MissingPersonalDetailsMagicCodeView';

type MissingPersonalDetailsMagicCodePageProps = PlatformStackScreenProps<MissingPersonalDetailsParamList, typeof SCREENS.MISSING_PERSONAL_DETAILS_CONFIRM_MAGIC_CODE>;

function MissingPersonalDetailsMagicCodePage({
    route: {
        params: {cardID = ''},
    },
}: MissingPersonalDetailsMagicCodePageProps) {
    return (
        <MissingPersonalDetailsMagicCodeView
            cardID={cardID}
            getBackRoute={ROUTES.MISSING_PERSONAL_DETAILS.getRoute}
        />
    );
}

export default MissingPersonalDetailsMagicCodePage;
