import useDynamicBackPath from '@hooks/useDynamicBackPath';

import createDynamicRoute from '@libs/Navigation/helpers/dynamicRoutesUtils/createDynamicRoute';
import type {PlatformStackScreenProps} from '@libs/Navigation/PlatformStackNavigation/types';
import type {ReportMissingPersonalDetailsNavigatorParamList} from '@libs/Navigation/types';

import MissingPersonalDetailsMagicCodeView from '@pages/MissingPersonalDetails/MissingPersonalDetailsMagicCodeView';

import {DYNAMIC_ROUTES} from '@src/ROUTES';
import type SCREENS from '@src/SCREENS';

import React, {useCallback} from 'react';

type DynamicMissingPersonalDetailsMagicCodePageProps = PlatformStackScreenProps<
    ReportMissingPersonalDetailsNavigatorParamList,
    typeof SCREENS.REPORT_MISSING_PERSONAL_DETAILS.DYNAMIC_CONFIRM_MAGIC_CODE
>;

function DynamicMissingPersonalDetailsMagicCodePage({
    route: {
        params: {cardID = ''},
    },
}: DynamicMissingPersonalDetailsMagicCodePageProps) {
    const basePath = useDynamicBackPath(DYNAMIC_ROUTES.REPORT_MISSING_PERSONAL_DETAILS_CONFIRM_MAGIC_CODE.path);

    const getBackRoute = useCallback((id: string) => createDynamicRoute(DYNAMIC_ROUTES.REPORT_MISSING_PERSONAL_DETAILS.getRoute(id), basePath), [basePath]);

    return (
        <MissingPersonalDetailsMagicCodeView
            cardID={cardID}
            getBackRoute={getBackRoute}
        />
    );
}

export default DynamicMissingPersonalDetailsMagicCodePage;
