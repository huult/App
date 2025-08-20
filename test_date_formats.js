// Simple test file to verify date formats are working
// This can be run with: node test_date_formats.js

// Simulate the formatDate function from Formula.ts
function formatDate(dateString, format = 'yyyy-MM-dd') {
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
        const getOrdinalSuffix = (num) => {
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
        const get12Hour = (hour) => {
            if (hour === 0) {
                return 12;
            }
            if (hour > 12) {
                return hour - 12;
            }
            return hour;
        };

        // Helper function for AM/PM
        const getAmPm = (hour, uppercase = false) => {
            const ampm = hour < 12 ? 'am' : 'pm';
            return uppercase ? ampm.toUpperCase() : ampm;
        };

        // Helper function for ISO week number
        const getISOWeek = (dateObj) => {
            const target = new Date(dateObj.valueOf());
            const dayNumber = (dateObj.getDay() + 6) % 7;
            target.setDate(target.getDate() - dayNumber + 3);
            const firstThursday = target.valueOf();
            target.setMonth(0, 1);
            if (target.getDay() !== 4) {
                target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
            }
            return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
        };

        // Helper function for days in month
        const getDaysInMonth = (dateObj) => {
            return new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).getDate();
        };

        switch (format) {
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

// Test with the date from the spreadsheet: '2025-07-31T21:42:02'
const testDate = '2025-07-31T21:42:02';

console.log('Testing date formats with:', testDate);
console.log('===============================');

// Test day formats
console.log('Day formats:');
console.log(`d: "${formatDate(testDate, 'd')}" (expected: "31")`);
console.log(`dd: "${formatDate(testDate, 'dd')}" (expected: "31")`);
console.log(`j: "${formatDate(testDate, 'j')}" (expected: "31")`);
console.log(`D: "${formatDate(testDate, 'D')}" (expected: "Thu")`);
console.log(`l: "${formatDate(testDate, 'l')}" (expected: "Thursday")`);
console.log(`N: "${formatDate(testDate, 'N')}" (expected: "4")`);
console.log(`S: "${formatDate(testDate, 'S')}" (expected: "st")`);
console.log(`w: "${formatDate(testDate, 'w')}" (expected: "4")`);

// Test month formats
console.log('\nMonth formats:');
console.log(`F: "${formatDate(testDate, 'F')}" (expected: "July")`);
console.log(`M: "${formatDate(testDate, 'M')}" (expected: "Jul")`);
console.log(`MM: "${formatDate(testDate, 'MM')}" (expected: "07")`);
console.log(`n: "${formatDate(testDate, 'n')}" (expected: "7")`);

// Test year formats
console.log('\nYear formats:');
console.log(`Y: "${formatDate(testDate, 'Y')}" (expected: "2025")`);
console.log(`yyyy: "${formatDate(testDate, 'yyyy')}" (expected: "2025")`);
console.log(`y: "${formatDate(testDate, 'y')}" (expected: "25")`);
console.log(`yy: "${formatDate(testDate, 'yy')}" (expected: "25")`);

// Test time formats
console.log('\nTime formats:');
console.log(`g: "${formatDate(testDate, 'g')}" (expected: "9")`);
console.log(`G: "${formatDate(testDate, 'G')}" (expected: "21")`);
console.log(`h: "${formatDate(testDate, 'h')}" (expected: "09")`);
console.log(`H: "${formatDate(testDate, 'H')}" (expected: "21")`);
console.log(`i: "${formatDate(testDate, 'i')}" (expected: "42")`);
console.log(`s: "${formatDate(testDate, 's')}" (expected: "02")`);
console.log(`a: "${formatDate(testDate, 'a')}" (expected: "pm")`);
console.log(`A: "${formatDate(testDate, 'A')}" (expected: "PM")`);

// Test full date/time formats
console.log('\nFull date/time formats:');
console.log(`c: "${formatDate(testDate, 'c')}"`);
console.log(`r: "${formatDate(testDate, 'r')}"`);
console.log(`U: "${formatDate(testDate, 'U')}" (expected: "1753998122")`);
