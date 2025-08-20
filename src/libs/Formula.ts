import type {OnyxEntry} from 'react-native-onyx';
import type {ValueOf} from 'type-fest';
import CONST from '@src/CONST';
import type Policy from '@src/types/onyx/Policy';
import type Report from '@src/types/onyx/Report';
import {getCurrencySymbol} from './CurrencyUtils';
import {getAllReportActions} from './ReportActionsUtils';
import {getReportTransactions} from './ReportUtils';
import {getCreated, isPartialTransaction} from './TransactionUtils';

type FormulaPart = {
    /** The original definition from the formula */
    definition: string;

    /** The type of formula part (report, field, user, etc.) */
    type: ValueOf<typeof FORMULA_PART_TYPES>;

    /** The field path for accessing data (e.g., ['type'], ['startdate'], ['total']) */
    fieldPath: string[];

    /** Functions to apply to the computed value (e.g., ['frontPart']) */
    functions: string[];
};

type FormulaContext = {
    report: Report;
    policy: OnyxEntry<Policy>;
};

const FORMULA_PART_TYPES = {
    REPORT: 'report',
    FIELD: 'field',
    USER: 'user',
    FREETEXT: 'freetext',
} as const;

/**
 * Extract formula parts from a formula string, handling nested braces and escapes
 * Based on OldDot Formula.extract method
 */
function extract(formula: string, opener = '{', closer = '}'): string[] {
    if (!formula || typeof formula !== 'string') {
        return [];
    }

    const letters = formula.split('');
    const sections: string[] = [];
    let nesting = 0;
    let start = 0;

    for (let i = 0; i < letters.length; i++) {
        // Found an escape character, skip the next character
        if (letters.at(i) === '\\') {
            i++;
            continue;
        }

        // Found an opener, save the spot
        if (letters.at(i) === opener) {
            if (nesting === 0) {
                start = i;
            }
            nesting++;
        }

        // Found a closer, decrement the nesting and possibly extract it
        if (letters.at(i) === closer && nesting > 0) {
            nesting--;
            if (nesting === 0) {
                sections.push(formula.substring(start, i + 1));
            }
        }
    }

    return sections;
}

/**
 * Parse a formula string into an array of formula parts
 * Based on OldDot Formula.parse method
 */
function parse(formula: string): FormulaPart[] {
    if (!formula || typeof formula !== 'string') {
        return [];
    }

    const parts: FormulaPart[] = [];
    const formulaParts = extract(formula);

    // If no formula parts found, treat the entire string as free text
    if (formulaParts.length === 0) {
        if (formula.trim()) {
            parts.push({
                definition: formula,
                type: FORMULA_PART_TYPES.FREETEXT,
                fieldPath: [],
                functions: [],
            });
        }
        return parts;
    }

    // Process the formula by splitting on formula parts to preserve free text
    let lastIndex = 0;

    formulaParts.forEach((part) => {
        const partIndex = formula.indexOf(part, lastIndex);

        // Add any free text before this formula part
        if (partIndex > lastIndex) {
            const freeText = formula.substring(lastIndex, partIndex);
            if (freeText) {
                parts.push({
                    definition: freeText,
                    type: FORMULA_PART_TYPES.FREETEXT,
                    fieldPath: [],
                    functions: [],
                });
            }
        }

        // Add the formula part
        parts.push(parsePart(part));
        lastIndex = partIndex + part.length;
    });

    // Add any remaining free text after the last formula part
    if (lastIndex < formula.length) {
        const freeText = formula.substring(lastIndex);
        if (freeText) {
            parts.push({
                definition: freeText,
                type: FORMULA_PART_TYPES.FREETEXT,
                fieldPath: [],
                functions: [],
            });
        }
    }

    return parts;
}

/**
 * Parse a single formula part definition into a FormulaPart object
 * Based on OldDot Formula.parsePart method
 */
function parsePart(definition: string): FormulaPart {
    const part: FormulaPart = {
        definition,
        type: FORMULA_PART_TYPES.FREETEXT,
        fieldPath: [],
        functions: [],
    };

    // If it doesn't start and end with braces, it's free text
    if (!definition.startsWith('{') || !definition.endsWith('}')) {
        return part;
    }

    // Remove the braces and trim
    const cleanDefinition = definition.slice(1, -1).trim();
    if (!cleanDefinition) {
        return part;
    }

    // Split on | to separate functions
    const segments = cleanDefinition.split('|');
    const fieldSegment = segments.at(0);
    const functions = segments.slice(1);

    // Split the field segment on : to get the field path
    const fieldPath = fieldSegment?.split(':');
    const type = fieldPath?.at(0)?.toLowerCase();

    // Determine the formula part type
    if (type === 'report') {
        part.type = FORMULA_PART_TYPES.REPORT;
    } else if (type === 'field') {
        part.type = FORMULA_PART_TYPES.FIELD;
    } else if (type === 'user') {
        part.type = FORMULA_PART_TYPES.USER;
    }

    // Set field path (excluding the type)
    part.fieldPath = fieldPath?.slice(1) ?? [];
    part.functions = functions;

    return part;
}

/**
 * Compute the value of a formula given a context
 */
function compute(formula: string, context: FormulaContext): string {
    if (!formula || typeof formula !== 'string') {
        return '';
    }

    const parts = parse(formula);
    let result = '';

    for (const part of parts) {
        let value = '';

        switch (part.type) {
            case FORMULA_PART_TYPES.REPORT:
                value = computeReportPart(part, context);
                value = value === '' ? part.definition : value;
                break;
            case FORMULA_PART_TYPES.FIELD:
                value = computeFieldPart(part);
                break;
            case FORMULA_PART_TYPES.USER:
                value = computeUserPart(part);
                break;
            case FORMULA_PART_TYPES.FREETEXT:
                value = part.definition;
                break;
            default:
                // If we don't recognize the part type, use the original definition
                value = part.definition;
        }

        // Apply any functions to the computed value
        value = applyFunctions(value, part.functions);
        result += value;
    }

    return result;
}

/**
 * Compute the value of a report formula part
 */
function computeReportPart(part: FormulaPart, context: FormulaContext): string {
    const {report, policy} = context;
    const [field, format] = part.fieldPath;

    if (!field) {
        return part.definition;
    }

    switch (field.toLowerCase()) {
        case 'type':
            return formatType(report.type);
        case 'startdate':
            return formatDate(getOldestTransactionDate(report.reportID), format);
        case 'total':
            return formatAmount(report.total, getCurrencySymbol(report.currency ?? '') ?? report.currency);
        case 'currency':
            return report.currency ?? '';
        case 'policyname':
        case 'workspacename':
            return policy?.name ?? '';
        case 'created':
            // Backend will always return at least one report action (of type created) and its date is equal to report's creation date
            // We can make it slightly more efficient in the future by ensuring report.created is always present in backend's responses
            return formatDate(getOldestReportActionDate(report.reportID), format);
        default:
            return part.definition;
    }
}

/**
 * Compute the value of a field formula part
 */
function computeFieldPart(part: FormulaPart): string {
    // Field computation will be implemented later
    return part.definition;
}

/**
 * Compute the value of a user formula part
 */
function computeUserPart(part: FormulaPart): string {
    // User computation will be implemented later
    return part.definition;
}

/**
 * Apply functions to a computed value
 */
function applyFunctions(value: string, functions: string[]): string {
    let result = value;

    for (const func of functions) {
        const [functionName, ...args] = func.split(':');

        switch (functionName.toLowerCase()) {
            case 'frontpart':
                result = getFrontPart(result);
                break;
            case 'substr':
                result = getSubstring(result, args);
                break;
            case 'domain':
                result = getDomainName(result);
                break;
            default:
                // Unknown function, leave value as is
                break;
        }
    }

    return result;
}

/**
 * Get the front part of an email or first word of a string
 */
function getFrontPart(value: string): string {
    const trimmed = value.trim();

    // If it's an email, return the part before @
    if (trimmed.includes('@')) {
        return trimmed.split('@').at(0) ?? '';
    }

    // Otherwise, return the first word
    return trimmed.split(' ').at(0) ?? '';
}

/**
 * Get the domain name of an email or URL
 */
function getDomainName(value: string): string {
    const trimmed = value.trim();

    // If it's an email, return the part after @
    if (trimmed.includes('@')) {
        return trimmed.split('@').at(1) ?? '';
    }

    return '';
}

/**
 * Get substring of a value
 */
function getSubstring(value: string, args: string[]): string {
    const start = parseInt(args.at(0) ?? '', 10) || 0;
    const length = args.at(1) ? parseInt(args.at(1) ?? '', 10) : undefined;

    if (length !== undefined) {
        return value.substring(start, start + length);
    }

    return value.substring(start);
}

/**
 * Format a date value with support for multiple date formats
 */
function formatDate(dateString: string | undefined, format = 'yyyy-MM-dd'): string {
    if (!dateString) {
        return '';
    }

    try {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) {
            return '';
        }

        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const dayOfYear = Math.floor((date.getTime() - new Date(year, 0, 0).getTime()) / (1000 * 60 * 60 * 24));

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Helper functions for ordinal suffix
        const getOrdinalSuffix = (num: number) => {
            const j = num % 10;
            const k = num % 100;
            if (j === 1 && k !== 11) {
                return 'st';
            }
            if (j === 2 && k !== 12) {
                return 'nd';
            }
            if (j === 3 && k !== 13) {
                return 'rd';
            }
            return 'th';
        };

        // Helper function for 12-hour format
        const get12Hour = (hour: number) => {
            if (hour === 0) {
                return 12;
            }
            if (hour > 12) {
                return hour - 12;
            }
            return hour;
        };

        // Helper function for AM/PM
        const getAmPm = (hour: number, uppercase = false) => {
            const ampm = hour < 12 ? 'am' : 'pm';
            return uppercase ? ampm.toUpperCase() : ampm;
        };

        // Helper function for ISO week number
        const getISOWeek = (dateObj: Date) => {
            const target = new Date(dateObj.valueOf());
            const dayNumber = (dateObj.getDay() + 6) % 7;
            target.setDate(target.getDate() - dayNumber + 3);
            const firstThursday = target.valueOf();
            target.setMonth(0, 1);
            if (target.getDay() !== 4) {
                target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
            }
            return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
        };

        // Helper function for days in month
        const getDaysInMonth = (dateObj: Date) => {
            return new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).getDate();
        };

        switch (format) {
            // Existing formats (preserved for backwards compatibility)
            case 'M/dd/yyyy':
                return `${month}/${day.toString().padStart(2, '0')}/${year}`;
            case 'MMMM dd, yyyy':
                return `${monthNames.at(month - 1)} ${day.toString().padStart(2, '0')}, ${year}`;
            case 'dd MMM yyyy':
                return `${day.toString().padStart(2, '0')} ${shortMonthNames.at(month - 1)} ${year}`;
            case 'yyyy/MM/dd':
                return `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
            case 'MMMM, yyyy':
                return `${monthNames.at(month - 1)}, ${year}`;
            case 'yy/MM/dd':
                return `${year.toString().slice(-2)}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
            case 'dd/MM/yy':
                return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
            case 'MM/dd/yyyy':
                return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
            case 'yyyy-MM-dd':
                return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

            // Day formats
            case 'd':
            case 'dd':
                return day.toString().padStart(2, '0');
            case 'ddd':
                return shortDayNames.at(dayOfWeek) ?? '';
            case 'dddd':
                return dayNames.at(dayOfWeek) ?? '';
            case 'D':
                return shortDayNames.at(dayOfWeek) ?? '';
            case 'j':
                return day.toString();
            case 'l':
                return dayNames.at(dayOfWeek) ?? '';
            case 'N':
                return dayOfWeek === 0 ? '7' : dayOfWeek.toString(); // ISO 8601: Monday = 1, Sunday = 7
            case 'S':
                return getOrdinalSuffix(day);
            case 'w':
                return dayOfWeek.toString();
            case 'z':
                return (dayOfYear - 1).toString(); // Starting from 0

            // Week formats
            case 'W':
                return getISOWeek(date).toString();

            // Month formats
            case 'F':
                return monthNames.at(month - 1) ?? '';
            case 'M':
            case 'MMM':
                return shortMonthNames.at(month - 1) ?? '';
            case 'MMMM':
                return monthNames.at(month - 1) ?? '';
            case 'MM':
                return month.toString().padStart(2, '0');
            case 'n':
                return month.toString();
            case 't':
                return getDaysInMonth(date).toString();

            // Year formats
            case 'Y':
            case 'yyyy':
                return year.toString();
            case 'y':
            case 'yy':
                return year.toString().slice(-2);

            // Time formats
            case 'a':
                return getAmPm(hours);
            case 'A':
            case 'tt':
                return getAmPm(hours, true);
            case 'g':
                return get12Hour(hours).toString();
            case 'G':
                return hours.toString();
            case 'h':
            case 'hh':
                return get12Hour(hours).toString().padStart(2, '0');
            case 'H':
            case 'HH':
                return hours.toString().padStart(2, '0');
            case 'i':
            case 'mm':
                return minutes.toString().padStart(2, '0');
            case 's':
            case 'ss':
                return seconds.toString().padStart(2, '0');

            // Full Date/Time formats
            case 'c':
                return date.toISOString();
            case 'r':
                return date.toUTCString();
            case 'U':
                return Math.floor(date.getTime() / 1000).toString();

            default:
                return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        }
    } catch {
        return '';
    }
}

/**
 * Format an amount value
 */
function formatAmount(amount: number | undefined, currency: string | undefined): string {
    if (amount === undefined) {
        return '';
    }

    const absoluteAmount = Math.abs(amount);
    const formattedAmount = (absoluteAmount / 100).toFixed(2);

    if (currency) {
        return `${currency}${formattedAmount}`;
    }

    return formattedAmount;
}

/**
 * Get the date of the oldest report action for a given report
 */
function getOldestReportActionDate(reportID: string): string | undefined {
    if (!reportID) {
        return undefined;
    }

    const reportActions = getAllReportActions(reportID);
    if (!reportActions || Object.keys(reportActions).length === 0) {
        return undefined;
    }

    let oldestDate: string | undefined;

    Object.values(reportActions).forEach((action) => {
        if (!action?.created) {
            return;
        }

        if (oldestDate && action.created > oldestDate) {
            return;
        }
        oldestDate = action.created;
    });

    return oldestDate;
}

/**
 * Format a report type to its human-readable string
 */
function formatType(type: string | undefined): string {
    if (!type) {
        return '';
    }

    const typeMapping: Record<string, string> = {
        [CONST.REPORT.TYPE.EXPENSE]: 'Expense Report',
        [CONST.REPORT.TYPE.INVOICE]: 'Invoice',
        [CONST.REPORT.TYPE.CHAT]: 'Chat',
        [CONST.REPORT.UNSUPPORTED_TYPE.BILL]: 'Bill',
        [CONST.REPORT.UNSUPPORTED_TYPE.PAYCHECK]: 'Paycheck',
        [CONST.REPORT.TYPE.IOU]: 'IOU',
        [CONST.REPORT.TYPE.TASK]: 'Task',
        trip: 'Trip',
    };

    return typeMapping[type.toLowerCase()] || type;
}

/**
 * Get the date of the oldest transaction for a given report
 */
function getOldestTransactionDate(reportID: string): string | undefined {
    if (!reportID) {
        return undefined;
    }

    const transactions = getReportTransactions(reportID);
    if (!transactions || transactions.length === 0) {
        return new Date().toISOString();
    }

    let oldestDate: string | undefined;

    transactions.forEach((transaction) => {
        const created = getCreated(transaction);
        if (!created) {
            return;
        }
        if (oldestDate && created >= oldestDate) {
            return;
        }
        if (isPartialTransaction(transaction)) {
            return;
        }
        oldestDate = created;
    });

    return oldestDate;
}

export {FORMULA_PART_TYPES, compute, extract, parse};

export type {FormulaContext, FormulaPart};
