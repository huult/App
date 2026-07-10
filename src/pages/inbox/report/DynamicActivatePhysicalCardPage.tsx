import useDynamicBackPath from '@hooks/useDynamicBackPath';

import type {PlatformStackScreenProps} from '@libs/Navigation/PlatformStackNavigation/types';
import type {ReportCardActivateNavigatorParamList} from '@libs/Navigation/types';

import ActivatePhysicalCardPageBase from '@pages/settings/Wallet/ActivatePhysicalCardPageBase';

import {DYNAMIC_ROUTES} from '@src/ROUTES';
import type SCREENS from '@src/SCREENS';

import React from 'react';

type DynamicActivatePhysicalCardPageProps = PlatformStackScreenProps<ReportCardActivateNavigatorParamList, typeof SCREENS.REPORT_CARD_ACTIVATE.DYNAMIC_ROOT>;

function DynamicActivatePhysicalCardPage({
    route: {
        params: {cardID = ''},
    },
}: DynamicActivatePhysicalCardPageProps) {
    const navigateBackTo = useDynamicBackPath(DYNAMIC_ROUTES.REPORT_CARD_ACTIVATE.path);

    return (
        <ActivatePhysicalCardPageBase
            cardID={cardID}
            navigateBackTo={navigateBackTo}
        />
    );
}

export default DynamicActivatePhysicalCardPage;
