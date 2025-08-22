/** Model of security group */
type SecurityGroup = {
    /** Whether the security group restricts primary login switching */
    hasRestrictedPrimaryLogin: boolean;

    /** Whether the security group restricts primary policy changes */
    enableRestrictedPrimaryPolicy: boolean;

    /** Whether the security group restricts policy creation */
    enableRestrictedPolicyCreation: boolean;

    /** Whether the security group enables restricted primary login */
    enableRestrictedPrimaryLogin: boolean;

    /** Whether the security group enables strict policy rules */
    enableStrictPolicyRules: boolean;

    /** The name of the security group */
    name: string;

    /** The specific policy ID that's set as the restricted primary policy for this domain */
    restrictedPrimaryPolicyID?: string;
};

export default SecurityGroup;
