import createDynamicRoute from '@libs/Navigation/helpers/createDynamicRoute';
import Navigation from '@libs/Navigation/Navigation';
import {DYNAMIC_ROUTES} from '@src/ROUTES';

// Adding payment card is currently only available on web.
function navigateFromAddPaymentCardItem() {
    return Navigation.navigate(createDynamicRoute(DYNAMIC_ROUTES.SUBSCRIPTION.path));
}

export default navigateFromAddPaymentCardItem;
