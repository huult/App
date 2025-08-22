/** Model of security group */
type SecurityGroup = {
    /** Whether the security group restricts primary login switching */
    hasRestrictedPrimaryLogin: boolean;

    /** Whether the security group restricts primary policy changes */
    enableRestrictedPrimaryPolicy: boolean;

    /** Whether the security group has a preferred policy setting */
    hasPreferredPolicy?: boolean;

    /** The restricted primary policy ID for the security group */
    restrictedPrimaryPolicyID?: string;
};

export default SecurityGroup;
