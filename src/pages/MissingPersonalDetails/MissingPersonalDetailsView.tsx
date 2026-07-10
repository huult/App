import FullScreenLoadingIndicator from '@components/FullscreenLoadingIndicator';

import useOnyx from '@hooks/useOnyx';

import Navigation from '@libs/Navigation/Navigation';
import type {SkeletonSpanReasonAttributes} from '@libs/telemetry/useSkeletonSpan';

import ONYXKEYS from '@src/ONYXKEYS';
import type {Route} from '@src/ROUTES';
import isLoadingOnyxValue from '@src/types/utils/isLoadingOnyxValue';

import React, {useCallback} from 'react';

import MissingPersonalDetailsContent from './MissingPersonalDetailsContent';

type MissingPersonalDetailsViewProps = {
    /** Card ID for the card that the user is adding personal details to */
    cardID: string;

    /** Builds the route for a given sub page. Lets the flow run under either a static or a dynamic (report-scoped) route. */
    getSubPageRoute: (cardID: string, subPage?: string, action?: 'edit') => Route;

    /** Builds the route to the magic code confirmation step. Lets the flow run under either a static or a dynamic (report-scoped) route. */
    getMagicCodeRoute: (cardID: string) => Route;
};

function MissingPersonalDetailsView({cardID, getSubPageRoute, getMagicCodeRoute}: MissingPersonalDetailsViewProps) {
    const [privatePersonalDetails, privatePersonalDetailsMetadata] = useOnyx(ONYXKEYS.PRIVATE_PERSONAL_DETAILS);
    const [draftValues, draftValuesMetadata] = useOnyx(ONYXKEYS.FORMS.PERSONAL_DETAILS_FORM_DRAFT);

    const isLoading = isLoadingOnyxValue(privatePersonalDetailsMetadata, draftValuesMetadata);

    const handleComplete = useCallback(() => {
        Navigation.navigate(getMagicCodeRoute(cardID));
    }, [cardID, getMagicCodeRoute]);

    if (isLoading) {
        const reasonAttributes: SkeletonSpanReasonAttributes = {context: 'MissingPersonalDetails'};
        return <FullScreenLoadingIndicator reasonAttributes={reasonAttributes} />;
    }

    return (
        <MissingPersonalDetailsContent
            privatePersonalDetails={privatePersonalDetails}
            draftValues={draftValues}
            onComplete={handleComplete}
            cardID={cardID}
            getSubPageRoute={getSubPageRoute}
        />
    );
}

export default MissingPersonalDetailsView;
export type {MissingPersonalDetailsViewProps};
