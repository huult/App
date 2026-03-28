import React, {useCallback} from 'react';
import FormProvider from '@components/Form/FormProvider';
import InputWrapper from '@components/Form/InputWrapper';
import type {FormInputErrors, FormOnyxValues} from '@components/Form/types';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import ScreenWrapper from '@components/ScreenWrapper';
import TextInput from '@components/TextInput';
import useAutoFocusInput from '@hooks/useAutoFocusInput';
import useLocalize from '@hooks/useLocalize';
import useOnyx from '@hooks/useOnyx';
import useThemeStyles from '@hooks/useThemeStyles';
import splitPathAndQuery from '@libs/Navigation/helpers/dynamicRoutesUtils/splitPathAndQuery';
import Navigation from '@libs/Navigation/Navigation';
import type {PlatformStackScreenProps} from '@libs/Navigation/PlatformStackNavigation/types';
import type {SettingsNavigatorParamList} from '@navigation/types';
import AccessOrNotFoundWrapper from '@pages/workspace/AccessOrNotFoundWrapper';
import {setPolicyCategoryGLCode} from '@userActions/Policy/Category';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import type {Route} from '@src/ROUTES';
import ROUTES, {DYNAMIC_ROUTES} from '@src/ROUTES';
import SCREENS from '@src/SCREENS';
import INPUT_IDS from '@src/types/form/WorkspaceCategoryForm';

type EditCategoryPageProps =
    | PlatformStackScreenProps<SettingsNavigatorParamList, typeof SCREENS.WORKSPACE.CATEGORY_GL_CODE>
    | PlatformStackScreenProps<SettingsNavigatorParamList, typeof SCREENS.SETTINGS_CATEGORIES.SETTINGS_CATEGORY_GL_CODE>;

function CategoryGLCodePage({route}: EditCategoryPageProps) {
    const styles = useThemeStyles();
    const {translate} = useLocalize();
    const policyID = route.params.policyID;
    const backTo = route.params.backTo;
    const [policyCategories] = useOnyx(`${ONYXKEYS.COLLECTION.POLICY_CATEGORIES}${policyID}`);

    const categoryName = route.params.categoryName;
    const glCode = policyCategories?.[categoryName]?.['GL Code'];
    const {inputCallbackRef} = useAutoFocusInput();
    const isQuickSettingsFlow = route.name === SCREENS.SETTINGS_CATEGORIES.SETTINGS_CATEGORY_GL_CODE;
    const quickSettingsCategoryRoute: Route = (() => {
        const baseRoute = ROUTES.SETTINGS_CATEGORIES_ROOT.getRoute(policyID, backTo);
        const [basePath, baseQuery] = splitPathAndQuery(baseRoute);
        const dynamicRoute = DYNAMIC_ROUTES.SETTINGS_CATEGORY_SETTINGS.getRoute(categoryName);
        const [dynamicPath, dynamicQuery] = splitPathAndQuery(dynamicRoute);
        const mergedParams = new URLSearchParams(baseQuery);
        const dynamicParams = new URLSearchParams(dynamicQuery);
        for (const [key, value] of dynamicParams.entries()) {
            mergedParams.set(key, value);
        }
        const query = mergedParams.toString();
        return `${basePath}/${dynamicPath}${query ? `?${query}` : ''}` as Route;
    })();

    const validate = useCallback(
        (values: FormOnyxValues<typeof ONYXKEYS.FORMS.WORKSPACE_CATEGORY_FORM>) => {
            const errors: FormInputErrors<typeof ONYXKEYS.FORMS.WORKSPACE_CATEGORY_FORM> = {};
            const value = values[INPUT_IDS.GL_CODE];

            if (value.length > CONST.MAX_LENGTH_256) {
                errors[INPUT_IDS.GL_CODE] = translate('common.error.characterLimitExceedCounter', value.length, CONST.MAX_LENGTH_256);
            }

            return errors;
        },
        [translate],
    );

    const editGLCode = useCallback(
        (values: FormOnyxValues<typeof ONYXKEYS.FORMS.WORKSPACE_CATEGORY_FORM>) => {
            const newGLCode = values.glCode.trim();
            if (newGLCode !== glCode) {
                setPolicyCategoryGLCode(policyID, categoryName, newGLCode, policyCategories);
            }
            Navigation.goBack((isQuickSettingsFlow ? quickSettingsCategoryRoute : ROUTES.WORKSPACE_CATEGORY_SETTINGS.getRoute(policyID, categoryName)) as Route);
        },
        [glCode, isQuickSettingsFlow, policyID, categoryName, policyCategories, quickSettingsCategoryRoute],
    );

    return (
        <AccessOrNotFoundWrapper
            accessVariants={[CONST.POLICY.ACCESS_VARIANTS.ADMIN, CONST.POLICY.ACCESS_VARIANTS.CONTROL]}
            policyID={route.params.policyID}
            featureName={CONST.POLICY.MORE_FEATURES.ARE_CATEGORIES_ENABLED}
        >
            <ScreenWrapper
                enableEdgeToEdgeBottomSafeAreaPadding
                style={[styles.defaultModalContainer]}
                testID="CategoryGLCodePage"
                shouldEnableMaxHeight
            >
                <HeaderWithBackButton
                    title={translate('workspace.categories.glCode')}
                    onBackButtonPress={() =>
                        Navigation.goBack(
                            (isQuickSettingsFlow ? quickSettingsCategoryRoute : ROUTES.WORKSPACE_CATEGORY_SETTINGS.getRoute(route.params.policyID, route.params.categoryName)) as Route,
                        )
                    }
                />
                <FormProvider
                    formID={ONYXKEYS.FORMS.WORKSPACE_CATEGORY_FORM}
                    validate={validate}
                    onSubmit={editGLCode}
                    submitButtonText={translate('common.save')}
                    style={[styles.mh5, styles.flex1]}
                    enabledWhenOffline
                    shouldHideFixErrorsAlert
                    addBottomSafeAreaPadding
                >
                    <InputWrapper
                        ref={inputCallbackRef}
                        InputComponent={TextInput}
                        defaultValue={glCode}
                        label={translate('workspace.categories.glCode')}
                        accessibilityLabel={translate('workspace.categories.glCode')}
                        inputID={INPUT_IDS.GL_CODE}
                        role={CONST.ROLE.PRESENTATION}
                    />
                </FormProvider>
            </ScreenWrapper>
        </AccessOrNotFoundWrapper>
    );
}

export default CategoryGLCodePage;
