import useDynamicBackPath from '@hooks/useDynamicBackPath';

import createDynamicRoute from '@libs/Navigation/helpers/dynamicRoutesUtils/createDynamicRoute';
import type {PlatformStackScreenProps} from '@libs/Navigation/PlatformStackNavigation/types';
import type {ReportMissingPersonalDetailsNavigatorParamList} from '@libs/Navigation/types';

import MissingPersonalDetailsView from '@pages/MissingPersonalDetails/MissingPersonalDetailsView';

import {DYNAMIC_ROUTES} from '@src/ROUTES';
import type SCREENS from '@src/SCREENS';

import React, {useCallback} from 'react';

type DynamicMissingPersonalDetailsPageProps = PlatformStackScreenProps<ReportMissingPersonalDetailsNavigatorParamList, typeof SCREENS.REPORT_MISSING_PERSONAL_DETAILS.DYNAMIC_ROOT>;

function DynamicMissingPersonalDetailsPage({
    route: {
        params: {cardID = ''},
    },
}: DynamicMissingPersonalDetailsPageProps) {
    const basePath = useDynamicBackPath(DYNAMIC_ROUTES.REPORT_MISSING_PERSONAL_DETAILS.path);

    const getSubPageRoute = useCallback(
        (id: string, subPage?: string, action?: 'edit') => createDynamicRoute(DYNAMIC_ROUTES.REPORT_MISSING_PERSONAL_DETAILS.getRoute(id, subPage, action), basePath),
        [basePath],
    );

    const getMagicCodeRoute = useCallback((id: string) => createDynamicRoute(DYNAMIC_ROUTES.REPORT_MISSING_PERSONAL_DETAILS_CONFIRM_MAGIC_CODE.getRoute(id), basePath), [basePath]);

    return (
        <MissingPersonalDetailsView
            cardID={cardID}
            getSubPageRoute={getSubPageRoute}
            getMagicCodeRoute={getMagicCodeRoute}
        />
    );
}

export default DynamicMissingPersonalDetailsPage;
