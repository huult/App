import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {View} from 'react-native';
import type {ValueOf} from 'type-fest';
import useAutoFocusInput from '@hooks/useAutoFocusInput';
import useCurrentUserPersonalDetails from '@hooks/useCurrentUserPersonalDetails';
import {useMemoizedLazyExpensifyIcons} from '@hooks/useLazyAsset';
import useLocalize from '@hooks/useLocalize';
import useOnyx from '@hooks/useOnyx';
import useThemeStyles from '@hooks/useThemeStyles';
import useWorkspaceConfirmationAvatar from '@hooks/useWorkspaceConfirmationAvatar';
import {clearDraftValues} from '@libs/actions/FormActions';
import {generateDefaultWorkspaceName, generatePolicyID} from '@libs/actions/Policy/Policy';
import type {CustomRNImageManipulatorResult} from '@libs/cropOrRotateImage/types';
import {addErrorMessage} from '@libs/ErrorUtils';
import getFirstAlphaNumericCharacter from '@libs/getFirstAlphaNumericCharacter';
import Navigation from '@libs/Navigation/Navigation';
import type {OptionData} from '@libs/ReportUtils';
import {getDefaultWorkspaceAvatar} from '@libs/ReportUtils';
import {isRequiredFulfilled} from '@libs/ValidationUtils';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import INPUT_IDS from '@src/types/form/WorkspaceConfirmationForm';
import isLoadingOnyxValue from '@src/types/utils/isLoadingOnyxValue';
import AvatarWithImagePicker from './AvatarWithImagePicker';
import CurrencySelector from './CurrencySelector';
import FormProvider from './Form/FormProvider';
import InputWrapper from './Form/InputWrapper';
import type {FormInputErrors, FormOnyxValues} from './Form/types';
import HeaderWithBackButton from './HeaderWithBackButton';
import MenuItemWithTopDescription from './MenuItemWithTopDescription';
import ScrollView from './ScrollView';
import Switch from './Switch';
import Text from './Text';
import TextInput from './TextInput';

type WorkspaceConfirmationSubmitFunctionParams = {
    name: string;
    currency: string;
    avatarFile: File | CustomRNImageManipulatorResult | undefined;
    policyID: string;
    planType?: ValueOf<typeof CONST.POLICY.TYPE>;
    ownerEmail?: string;
    makeMeAdmin?: boolean;
};

type WorkspaceConfirmationFormProps = {
    /** The email of the workspace owner
     * @summary Approved Accountants and Guides can enter a flow where they make a workspace for other users,
     * and those are passed as a search parameter when using transition links
     */
    policyOwnerEmail?: string;

    /** Submit function */
    onSubmit: (params: WorkspaceConfirmationSubmitFunctionParams) => void;

    /** Go back function */
    onBackButtonPress?: () => void;

    /** Whether bottom safe area padding should be added */
    addBottomSafeAreaPadding?: boolean;
};

function WorkspaceConfirmationForm({onSubmit, policyOwnerEmail = '', onBackButtonPress = () => Navigation.goBack(), addBottomSafeAreaPadding = true}: WorkspaceConfirmationFormProps) {
    const icons = useMemoizedLazyExpensifyIcons(['Camera', 'ImageCropSquareMask']);
    const styles = useThemeStyles();
    const {translate} = useLocalize();
    const {inputCallbackRef} = useAutoFocusInput();

    const [account] = useOnyx(ONYXKEYS.ACCOUNT);
    const [allPolicies] = useOnyx(ONYXKEYS.COLLECTION.POLICY);
    const [session, metadata] = useOnyx(ONYXKEYS.SESSION, {canBeMissing: false});
    const [draftValues] = useOnyx(ONYXKEYS.FORMS.WORKSPACE_CONFIRMATION_FORM_DRAFT, {canBeMissing: true});

    const currentUserPersonalDetails = useCurrentUserPersonalDetails();
    const isApprovedAccountant = !!account?.isApprovedAccountant;

    // Determine if user is a member of any Control workspaces
    const hasControlWorkspace = useMemo(() => {
        if (!allPolicies) {
            return false;
        }
        return Object.values(allPolicies).some((policy) => policy?.type === CONST.POLICY.TYPE.CORPORATE);
    }, [allPolicies]);

    const defaultWorkspaceName = generateDefaultWorkspaceName(policyOwnerEmail || session?.email);
    const [workspaceNameFirstCharacter, setWorkspaceNameFirstCharacter] = useState(defaultWorkspaceName ?? '');

    const userCurrency = draftValues?.currency ?? currentUserPersonalDetails?.localCurrencyCode ?? CONST.CURRENCY.USD;

    // State for approved accountant fields
    const [selectedPlanType, setSelectedPlanType] = useState<ValueOf<typeof CONST.POLICY.TYPE>>(hasControlWorkspace ? CONST.POLICY.TYPE.CORPORATE : CONST.POLICY.TYPE.TEAM);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- setSelectedOwner will be used when owner selector is implemented
    const [selectedOwner, setSelectedOwner] = useState<OptionData | null>(() => {
        // Initialize owner to current user for approved accountants
        if (isApprovedAccountant && currentUserPersonalDetails) {
            return {
                text: currentUserPersonalDetails.displayName ?? currentUserPersonalDetails.login ?? '',
                login: currentUserPersonalDetails.login,
                accountID: currentUserPersonalDetails.accountID,
            } as OptionData;
        }
        return null;
    });
    const [makeMeAdmin, setMakeMeAdmin] = useState(true);

    const validate = useCallback(
        (values: FormOnyxValues<typeof ONYXKEYS.FORMS.WORKSPACE_CONFIRMATION_FORM>) => {
            const errors: FormInputErrors<typeof ONYXKEYS.FORMS.WORKSPACE_CONFIRMATION_FORM> = {};
            const name = values.name.trim();

            if (!isRequiredFulfilled(name)) {
                errors.name = translate('workspace.editor.nameIsRequiredError');
            } else if ([...name].length > CONST.TITLE_CHARACTER_LIMIT) {
                // Uses the spread syntax to count the number of Unicode code points instead of the number of UTF-16
                // code units.
                addErrorMessage(errors, 'name', translate('common.error.characterLimitExceedCounter', [...name].length, CONST.TITLE_CHARACTER_LIMIT));
            }

            if (!isRequiredFulfilled(values[INPUT_IDS.CURRENCY])) {
                errors[INPUT_IDS.CURRENCY] = translate('common.error.fieldRequired');
            }

            return errors;
        },
        [translate],
    );

    const policyID = useMemo(() => generatePolicyID(), []);

    useEffect(() => {
        return () => {
            clearDraftValues(ONYXKEYS.FORMS.WORKSPACE_CONFIRMATION_FORM);
        };
    }, []);

    const [workspaceAvatar, setWorkspaceAvatar] = useState<{avatarUri: string | null; avatarFileName?: string | null; avatarFileType?: string | null}>({
        avatarUri: null,
        avatarFileName: null,
        avatarFileType: null,
    });
    const [avatarFile, setAvatarFile] = useState<File | CustomRNImageManipulatorResult | undefined>();

    const stashedLocalAvatarImage = workspaceAvatar?.avatarUri ?? undefined;

    const DefaultAvatar = useWorkspaceConfirmationAvatar({
        policyID,
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- nullish coalescing cannot be used if left side can be empty string
        source: stashedLocalAvatarImage || getDefaultWorkspaceAvatar(workspaceNameFirstCharacter),
        name: workspaceNameFirstCharacter,
    });

    return (
        <>
            <HeaderWithBackButton
                title={translate('workspace.new.confirmWorkspace')}
                onBackButtonPress={onBackButtonPress}
            />
            <ScrollView
                contentContainerStyle={styles.flexGrow1}
                keyboardShouldPersistTaps="always"
            >
                <View style={[styles.ph5, styles.pv3]}>
                    <Text style={[styles.mb3, styles.webViewStyles.baseFontStyle, styles.textSupporting]}>{translate('workspace.emptyWorkspace.subtitle')}</Text>
                </View>
                <AvatarWithImagePicker
                    isUsingDefaultAvatar={!stashedLocalAvatarImage}
                    avatarID={policyID}
                    source={stashedLocalAvatarImage}
                    onImageSelected={(image) => {
                        setAvatarFile(image);
                        setWorkspaceAvatar({avatarUri: image.uri ?? '', avatarFileName: image.name ?? '', avatarFileType: image.type});
                    }}
                    onImageRemoved={() => {
                        setAvatarFile(undefined);
                        setWorkspaceAvatar({avatarUri: null, avatarFileName: null, avatarFileType: null});
                    }}
                    size={CONST.AVATAR_SIZE.X_LARGE}
                    avatarStyle={[styles.avatarXLarge, styles.alignSelfCenter]}
                    editIcon={icons.Camera}
                    editIconStyle={styles.smallEditIconAccount}
                    type={CONST.ICON_TYPE_WORKSPACE}
                    style={[styles.w100, styles.alignItemsCenter, styles.mv4, styles.mb6, styles.alignSelfCenter, styles.ph5]}
                    DefaultAvatar={DefaultAvatar}
                    editorMaskImage={icons.ImageCropSquareMask}
                />
                <FormProvider
                    formID={ONYXKEYS.FORMS.WORKSPACE_CONFIRMATION_FORM}
                    submitButtonText={translate('common.confirm')}
                    style={[styles.flexGrow1, styles.ph5]}
                    scrollContextEnabled
                    validate={validate}
                    onSubmit={(val) =>
                        onSubmit({
                            name: val[INPUT_IDS.NAME],
                            currency: val[INPUT_IDS.CURRENCY],
                            avatarFile,
                            policyID,
                            ...(isApprovedAccountant && {
                                planType: selectedPlanType,
                                ownerEmail: selectedOwner?.login ?? '',
                                makeMeAdmin: selectedOwner && selectedOwner.login !== currentUserPersonalDetails?.login ? makeMeAdmin : undefined,
                            }),
                        })
                    }
                    enabledWhenOffline
                    addBottomSafeAreaPadding={addBottomSafeAreaPadding}
                >
                    <View style={styles.mb4}>
                        {!isLoadingOnyxValue(metadata) && (
                            <InputWrapper
                                InputComponent={TextInput}
                                role={CONST.ROLE.PRESENTATION}
                                inputID={INPUT_IDS.NAME}
                                label={translate('workspace.common.workspaceName')}
                                accessibilityLabel={translate('workspace.common.workspaceName')}
                                spellCheck={false}
                                defaultValue={defaultWorkspaceName}
                                onChangeText={(str) => {
                                    if (getFirstAlphaNumericCharacter(str) === getFirstAlphaNumericCharacter(workspaceNameFirstCharacter)) {
                                        return;
                                    }
                                    setWorkspaceNameFirstCharacter(str);
                                }}
                                ref={inputCallbackRef}
                            />
                        )}

                        <View style={[styles.mhn5, styles.mt4]}>
                            <InputWrapper
                                InputComponent={CurrencySelector}
                                inputID={INPUT_IDS.CURRENCY}
                                label={translate('workspace.editor.currencyInputLabel')}
                                value={userCurrency}
                                shouldShowCurrencySymbol
                                currencySelectorRoute={ROUTES.CURRENCY_SELECTION}
                            />
                        </View>

                        {isApprovedAccountant && (
                            <>
                                {/* Plan Type Selector */}
                                <View style={[styles.mhn5, styles.mt4]}>
                                    <MenuItemWithTopDescription
                                        title={selectedPlanType === CONST.POLICY.TYPE.CORPORATE ? translate('workspace.type.control') : translate('workspace.type.collect')}
                                        description={translate('workspace.common.planType')}
                                        shouldShowRightIcon
                                        onPress={() => {
                                            // Toggle between Control and Collect
                                            setSelectedPlanType(selectedPlanType === CONST.POLICY.TYPE.CORPORATE ? CONST.POLICY.TYPE.TEAM : CONST.POLICY.TYPE.CORPORATE);
                                        }}
                                    />
                                </View>

                                {/* Owner Selector */}
                                <View style={[styles.mhn5, styles.mt4]}>
                                    <MenuItemWithTopDescription
                                        title={selectedOwner?.text ?? currentUserPersonalDetails?.displayName ?? currentUserPersonalDetails?.login ?? ''}
                                        description={translate('common.owner')}
                                        shouldShowRightIcon
                                        onPress={() => {
                                            // TODO: Navigate to participant selector page
                                            // Navigation.navigate(ROUTES.WORKSPACE_OWNER_SELECTOR);
                                        }}
                                    />
                                </View>

                                {/* Keep me as an admin toggle - only show when owner is different from current user */}
                                {!!selectedOwner && selectedOwner.login !== currentUserPersonalDetails?.login && (
                                    <View style={[styles.mt4, styles.flexRow, styles.justifyContentBetween, styles.alignItemsCenter]}>
                                        <Text>{translate('workspace.new.keepMeAsAdmin')}</Text>
                                        <Switch
                                            isOn={makeMeAdmin}
                                            onToggle={setMakeMeAdmin}
                                            accessibilityLabel={translate('workspace.new.keepMeAsAdmin')}
                                        />
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </FormProvider>
            </ScrollView>
        </>
    );
}

export default WorkspaceConfirmationForm;

export type {WorkspaceConfirmationSubmitFunctionParams};
