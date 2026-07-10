import ROUTES from '@src/ROUTES';

import React from 'react';

import MissingPersonalDetailsView from './MissingPersonalDetailsView';

function MissingPersonalDetails({route: {params: {cardID = ''} = {}}}) {
    return (
        <MissingPersonalDetailsView
            cardID={cardID}
            getSubPageRoute={ROUTES.MISSING_PERSONAL_DETAILS.getRoute}
            getMagicCodeRoute={ROUTES.MISSING_PERSONAL_DETAILS_CONFIRM_MAGIC_CODE.getRoute}
        />
    );
}

export default MissingPersonalDetails;
