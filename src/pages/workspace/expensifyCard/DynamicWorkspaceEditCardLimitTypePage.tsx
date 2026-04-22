import React from 'react';
import type {ComponentProps} from 'react';
import useDynamicBackPath from '@hooks/useDynamicBackPath';
import type {PlatformStackScreenProps} from '@libs/Navigation/PlatformStackNavigation/types';
import type {SettingsNavigatorParamList} from '@libs/Navigation/types';
import WorkspaceEditCardLimitTypePage from '@pages/workspace/expensifyCard/WorkspaceEditCardLimitTypePage';
import {DYNAMIC_ROUTES} from '@src/ROUTES';
import SCREENS from '@src/SCREENS';

type DynamicWorkspaceEditCardLimitTypePageProps = PlatformStackScreenProps<SettingsNavigatorParamList, typeof SCREENS.WORKSPACE.DYNAMIC_EXPENSIFY_CARD_LIMIT_TYPE>;

function DynamicWorkspaceEditCardLimitTypePage({route}: DynamicWorkspaceEditCardLimitTypePageProps) {
    const backPath = useDynamicBackPath(DYNAMIC_ROUTES.WORKSPACE_EXPENSIFY_CARD_LIMIT_TYPE.path);

    const routeForStaticPage = {
        ...route,
        name: SCREENS.EXPENSIFY_CARD.EXPENSIFY_CARD_LIMIT_TYPE,
        params: {...route.params, backTo: backPath},
    } as ComponentProps<typeof WorkspaceEditCardLimitTypePage>['route'];

    return (
        <WorkspaceEditCardLimitTypePage
            route={routeForStaticPage}
            testID="DynamicWorkspaceEditCardLimitTypePage"
        />
    );
}

export default DynamicWorkspaceEditCardLimitTypePage;
