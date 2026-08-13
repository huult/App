import type {IllustrationName} from '@components/Icon/IllustrationLoader';

import type {TranslationPaths} from '@src/languages/types';
import ROUTES from '@src/ROUTES';
import type {Route} from '@src/ROUTES';
import type {Policy} from '@src/types/onyx';

import type {ImageSourcePropType} from 'react-native';
import type {OnyxEntry} from 'react-native-onyx';

import {hasVendorFeature} from './PolicyUtils';

type ProductMarketingAnnouncementVisual =
    | {
          type: 'image';
          source: ImageSourcePropType;
      }
    | {
          type: 'illustration';
          name: IllustrationName;
      };

/** Context passed to `getCtaRoute` for the target admin workspace, when the user has one. Member-only variants ignore it. */
type ProductMarketingAnnouncementCtaContext = {
    /** ID of the target admin workspace (the active policy when the user administers it, otherwise their first active admin workspace). */
    policyID?: string;

    /** Full policy object for `policyID`, needed to branch the CTA on workspace feature state (e.g. `hasVendorFeature`). */
    policy?: OnyxEntry<Policy>;

    /** Whether the current user has the vendor-matching beta, needed alongside `policy` to evaluate `hasVendorFeature`. */
    isVendorMatchingBetaEnabled?: boolean;
};

/** One audience-specific content variant of a product marketing announcement. All content is authored by marketing per release. */
type ProductMarketingAnnouncementVariant = {
    /** Marketing-supplied product screenshot or fallback illustration shown at the top of the window. */
    visual: ProductMarketingAnnouncementVisual;

    /** Short, bolded heading describing the feature being promoted. */
    heading: TranslationPaths;

    /** 1–2 sentences describing the feature and its benefit. */
    body: TranslationPaths;

    /** Label of the primary CTA button. */
    ctaLabel: TranslationPaths;

    /** Builds the route the primary CTA navigates to. */
    getCtaRoute: (context: ProductMarketingAnnouncementCtaContext) => Route;
};

/** A single product marketing announcement with audience-targeted content variants. */
type ProductMarketingAnnouncement = {
    /** Stable key shared by every audience variant of this product update. A later update must use a new key. */
    updateKey: string;

    /** Variant shown to users who are an admin on at least one active workspace. Admin prevails when a user is both member and admin. */
    admin: ProductMarketingAnnouncementVariant;

    /** Optional variant shown to users without an admin role on any active workspace. */
    member?: ProductMarketingAnnouncementVariant;
};

/**
 * The single active product marketing announcement, or null when no window should be shown.
 * Only one announcement can be active at a time — there is no stacking or queueing. When the active
 * announcement is dismissed, nothing is shown until a later release replaces it with a new update key.
 */
const ACTIVE_PRODUCT_MARKETING_ANNOUNCEMENT: ProductMarketingAnnouncement | null = {
    updateKey: 'productUpdateAugust2026',
    admin: {
        visual: {type: 'illustration', name: 'Accounting'},
        heading: 'productMarketingWindow.roleTypes.admin.heading',
        body: 'productMarketingWindow.roleTypes.admin.body',
        ctaLabel: 'productMarketingWindow.roleTypes.cta',
        getCtaRoute: ({policyID, policy, isVendorMatchingBetaEnabled}) =>
            hasVendorFeature(policy, !!isVendorMatchingBetaEnabled) ? ROUTES.WORKSPACE_VENDORS.getRoute(policyID) : ROUTES.WORKSPACE_MORE_FEATURES.getRoute(policyID),
    },
    member: {
        visual: {type: 'illustration', name: 'AgentsIceCream'},
        heading: 'productMarketingWindow.roleTypes.member.heading',
        body: 'productMarketingWindow.roleTypes.member.body',
        ctaLabel: 'productMarketingWindow.roleTypes.cta',
        getCtaRoute: () => ROUTES.SETTINGS_AGENTS_NEW.getRoute(),
    },
};

/** Whether the given announcement was already dismissed by the user. */
function isProductMarketingAnnouncementDismissed(announcement: ProductMarketingAnnouncement | null, lastDismissedMarketingWindow: OnyxEntry<string>): boolean {
    return !!announcement && announcement.updateKey === lastDismissedMarketingWindow;
}

/**
 * Resolves the content variant of the announcement the user should see, or undefined when no window should be shown.
 * Dismissal never falls through to another announcement — when the active announcement is dismissed, nothing is shown.
 */
function getProductMarketingAnnouncementVariant(
    announcement: ProductMarketingAnnouncement | null,
    hasActiveAdminPolicies: boolean,
    lastDismissedMarketingWindow: OnyxEntry<string>,
): ProductMarketingAnnouncementVariant | undefined {
    if (!announcement || isProductMarketingAnnouncementDismissed(announcement, lastDismissedMarketingWindow)) {
        return undefined;
    }
    return hasActiveAdminPolicies ? announcement.admin : announcement.member;
}

export {ACTIVE_PRODUCT_MARKETING_ANNOUNCEMENT, isProductMarketingAnnouncementDismissed, getProductMarketingAnnouncementVariant};
export type {ProductMarketingAnnouncement, ProductMarketingAnnouncementVariant};
