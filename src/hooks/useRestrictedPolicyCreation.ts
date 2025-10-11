
import ONYXKEYS from '@src/ONYXKEYS';
import useOnyx from './useOnyx';

/**
 * Hook to get the enableRestrictedPolicyCreation setting from the user's domain security group
 */
function useRestrictedPolicyCreation(): boolean {
    // Get the user's domain security group mapping
    const [domainSecurityGroups = {} as Record<string, string>] = useOnyx(ONYXKEYS.MY_DOMAIN_SECURITY_GROUPS);
    const [session = {} as {email?: string}] = useOnyx(ONYXKEYS.SESSION);
    const email: string = session.email ?? '';
    const domain: string = email.split('@').at(1) ?? '';
    const securityGroupID: string | undefined = domainSecurityGroups[domain];
    const [securityGroup = undefined] = useOnyx(`${ONYXKEYS.COLLECTION.SECURITY_GROUP}${securityGroupID}`);

    return !!securityGroup?.enableRestrictedPolicyCreation;
}

export default useRestrictedPolicyCreation;
