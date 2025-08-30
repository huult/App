import {addMonths, startOfMonth} from 'date-fns';

function appendMidnightTime(date: string): string {
    return `${date}T00:00:00`;
}

function formatSubscriptionEndDate(date: string | undefined, locale?: string): string {
    if (!date) {
        return '';
    }

    const dateWithMidnightTime = appendMidnightTime(date);

    return new Intl.DateTimeFormat(locale, {dateStyle: 'medium'}).format(new Date(dateWithMidnightTime));
}

function getNewSubscriptionRenewalDate(locale?: string): string {
    return new Intl.DateTimeFormat(locale, {dateStyle: 'medium'}).format(startOfMonth(addMonths(new Date(), 12)));
}

export {getNewSubscriptionRenewalDate, formatSubscriptionEndDate};
