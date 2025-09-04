import lodashMaxBy from 'lodash/maxBy';
import {useMemo} from 'react';
import type {OnyxCollection, OnyxEntry} from 'react-native-onyx';
import type {ValueOf} from 'type-fest';
import {getCurrentUserAccountID} from '@libs/actions/Report';
import {getPolicyEmployeeListByIdWithoutCurrentUser} from '@libs/PolicyUtils';
import {getMostRecentlyVisitedReport, hasExpensifyGuidesEmails, isArchivedReport, isDomainRoom, isSystemChat} from '@libs/ReportUtils';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import type {Policy, Report, ReportMetadata, ReportNameValuePairs} from '@src/types/onyx';
import {isEmptyObject} from '@src/types/utils/EmptyObject';
import useOnyx from './useOnyx';

/**
 * Helper function to get chat type from report
 */
function getChatType(report: OnyxEntry<Report>): ValueOf<typeof CONST.REPORT.CHAT_TYPE> | undefined {
    return report?.chatType;
}

/**
 * Helper function to filter reports by policy ID and member account IDs
 */
function filterReportsByPolicyIDAndMemberAccountIDs(reports: Array<OnyxEntry<Report>>, policyMemberAccountIDs: number[] = [], policyID?: string) {
    return reports.filter((report) => {
        if (!report?.reportID) {
            return false;
        }

        if (policyID && report.policyID !== policyID) {
            return false;
        }

        if (policyMemberAccountIDs.length > 0) {
            const reportParticipantAccountIDs = Object.keys(report.participants ?? {}).map((key) => Number(key));
            const hasParticipantFromPolicy = reportParticipantAccountIDs.some((participantAccountID) => policyMemberAccountIDs.includes(participantAccountID));
            if (!hasParticipantFromPolicy) {
                return false;
            }
        }

        return true;
    });
}

/**
 * Custom hook to find the last accessed report using derived values instead of global variables.
 *
 * This hook replaces the usage of the global `findLastAccessedReport` function which relies on
 * global variables populated by `Onyx.connect()` callbacks. These global variables can become
 * stale when switching between browser tabs, causing infinite loading or incorrect report selection.
 *
 * By using `useOnyx` hooks, this ensures we always get fresh, up-to-date data directly from Onyx
 * storage, preventing the "Maximum update depth exceeded" errors and infinite loading issues
 * that occur when using stale global variables between tabs.
 *
 * @param ignoreDomainRooms - Whether to ignore domain rooms in the search
 * @param openOnAdminRoom - Whether to prioritize opening an admin room
 * @param policyID - Optional policy ID to filter reports by
 * @param excludeReportID - Optional report ID to exclude from the search
 * @returns The last accessed report or undefined if none found
 */
function useFindLastAccessedReport(ignoreDomainRooms = false, openOnAdminRoom = false, policyID?: string, excludeReportID?: string): OnyxEntry<Report> {
    const currentUserAccountID = getCurrentUserAccountID();

    // Use useOnyx hooks to get fresh data instead of relying on global variables
    const [allReports] = useOnyx(ONYXKEYS.COLLECTION.REPORT);
    const [allReportMetadata] = useOnyx(ONYXKEYS.COLLECTION.REPORT_METADATA);
    const [allReportNameValuePairs] = useOnyx(ONYXKEYS.COLLECTION.REPORT_NAME_VALUE_PAIRS);
    const [allPolicies] = useOnyx(ONYXKEYS.COLLECTION.POLICY);

    return useMemo(() => {
        if (!allReports) {
            return undefined;
        }

        const typedPolicies = allPolicies as OnyxCollection<Policy>;
        const typedReports = allReports as OnyxCollection<Report>;
        const typedReportMetadata = allReportMetadata as OnyxCollection<ReportMetadata>;
        const typedReportNameValuePairs = allReportNameValuePairs as OnyxCollection<ReportNameValuePairs>;

        const policyMemberAccountIDs = getPolicyEmployeeListByIdWithoutCurrentUser(typedPolicies, policyID, currentUserAccountID);

        let reportsValues = Object.values(typedReports ?? {});

        if (!!policyID || policyMemberAccountIDs.length > 0) {
            reportsValues = filterReportsByPolicyIDAndMemberAccountIDs(reportsValues, policyMemberAccountIDs, policyID);
        }

        let adminReport: OnyxEntry<Report>;
        if (openOnAdminRoom) {
            adminReport = reportsValues.find((report) => {
                const chatType = getChatType(report);
                return chatType === CONST.REPORT.CHAT_TYPE.POLICY_ADMINS;
            });
        }
        if (adminReport) {
            return adminReport;
        }

        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        const shouldFilter = excludeReportID || ignoreDomainRooms;
        if (shouldFilter) {
            reportsValues = reportsValues.filter((report) => {
                if (excludeReportID && report?.reportID === excludeReportID) {
                    return false;
                }

                // We allow public announce rooms, admins, and announce rooms through since we bypass the default rooms beta for them.
                // Domain rooms are now the only type of default room that are on the defaultRooms beta.
                if (ignoreDomainRooms && isDomainRoom(report) && !hasExpensifyGuidesEmails(Object.keys(report?.participants ?? {}).map(Number))) {
                    return false;
                }

                return true;
            });
        }

        // Filter out the system chat (Expensify chat) because the composer is disabled in it,
        // and it prompts the user to use the Concierge chat instead.
        reportsValues =
            reportsValues.filter((report) => {
                const reportNameValuePairs = typedReportNameValuePairs?.[`${ONYXKEYS.COLLECTION.REPORT_NAME_VALUE_PAIRS}${report?.reportID}`];
                return !isSystemChat(report) && !isArchivedReport(reportNameValuePairs);
            }) ?? [];

        // At least two reports remain: self DM and Concierge chat.
        // Return the most recently visited report. Get the last read report from the report metadata.
        // If allReportMetadata is empty we'll return most recent report owned by user
        if (isEmptyObject(typedReportMetadata)) {
            const ownedReports = reportsValues.filter((report) => report?.ownerAccountID === currentUserAccountID);
            if (ownedReports.length > 0) {
                return lodashMaxBy(ownedReports, (a) => a?.lastReadTime ?? '');
            }
            return lodashMaxBy(reportsValues, (a) => a?.lastReadTime ?? '');
        }
        return getMostRecentlyVisitedReport(reportsValues, typedReportMetadata);
    }, [allReports, allReportMetadata, allReportNameValuePairs, allPolicies, ignoreDomainRooms, openOnAdminRoom, policyID, excludeReportID, currentUserAccountID]);
}

export default useFindLastAccessedReport;
