import type {ValueOf} from 'type-fest';
import type Form from './Form';

const INPUT_IDS = {
    NAME: 'name',
    CURRENCY: 'currency',
    PLAN_TYPE: 'planType',
    OWNER_EMAIL: 'ownerEmail',
    MAKE_ME_ADMIN: 'makeMeAdmin',
} as const;

type InputID = ValueOf<typeof INPUT_IDS>;

type WorkspaceConfirmationForm = Form<
    InputID,
    {
        [INPUT_IDS.NAME]: string;
        [INPUT_IDS.CURRENCY]: string;
        [INPUT_IDS.PLAN_TYPE]: string;
        [INPUT_IDS.OWNER_EMAIL]: string;
        [INPUT_IDS.MAKE_ME_ADMIN]: boolean;
    }
>;

export type {WorkspaceConfirmationForm};
export default INPUT_IDS;
