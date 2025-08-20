# Formula Date Formats Implementation

This document outlines the date formats that have been implemented in the `Formula.ts` library to support optimistic report name formulas.

## Overview

The `formatDate` function in `Formula.ts` now supports all useful date formats from the specification, matching both PHP DateTime and DateJS format specifiers where applicable.

## Supported Date Formats

### Day Formats
- `d` / `dd` - Day of the month with leading zeros (01-31)
- `j` - Day of the month without leading zeros (1-31)
- `D` - Abbreviated day name (Mon-Sun)
- `ddd` - Abbreviated day name (Mon-Sun) 
- `dddd` / `l` - Full day name (Monday-Sunday)
- `N` - ISO 8601 day of week (1=Monday, 7=Sunday)
- `w` - Numeric day of week (0=Sunday, 6=Saturday)
- `S` - English ordinal suffix (st, nd, rd, th)
- `z` - Day of year starting from 0 (0-365)

### Week Formats
- `W` - ISO 8601 week number of year

### Month Formats
- `F` / `MMMM` - Full month name (January-December)
- `M` / `MMM` - Abbreviated month name (Jan-Dec)
- `MM` - Month with leading zero (01-12)
- `n` - Month without leading zero (1-12)
- `t` - Number of days in month (28-31)

### Year Formats
- `Y` / `yyyy` - Full 4-digit year (e.g., 2025)
- `y` / `yy` - 2-digit year (e.g., 25)

### Time Formats
- `H` / `HH` - 24-hour format hour with leading zeros (00-23)
- `G` - 24-hour format hour without leading zeros (0-23)
- `h` / `hh` - 12-hour format hour with leading zeros (01-12)
- `g` - 12-hour format hour without leading zeros (1-12)
- `i` / `mm` - Minutes with leading zeros (00-59)
- `s` / `ss` - Seconds with leading zeros (00-59)
- `a` - Lowercase AM/PM (am/pm)
- `A` / `tt` - Uppercase AM/PM (AM/PM)

### Full Date/Time Formats
- `c` - ISO 8601 date/time (e.g., 2025-07-31T21:42:02.000Z)
- `r` - RFC 2822 formatted date (e.g., Thu, 31 Jul 2025 21:42:02 GMT)
- `U` - Unix timestamp (seconds since epoch)

### Legacy Formats (Preserved)
- `yyyy-MM-dd` - ISO date format (default)
- `MM/dd/yyyy` - US date format
- `M/dd/yyyy` - US date format with single-digit month
- `dd MMM yyyy` - European-style date
- `MMMM dd, yyyy` - Long US date format
- `MMMM, yyyy` - Month and year only
- `yyyy/MM/dd` - ISO-style with slashes
- `yy/MM/dd` - Short year with slashes
- `dd/MM/yy` - European short date

## Usage Examples

```typescript
import { compute } from '@src/libs/Formula';

const context = {
  report: {
    reportID: 'R123',
    type: 'expense',
    created: '2025-07-31T21:42:02Z'
  },
  policy: { name: 'Company Policy' }
};

// Basic date formats
compute('{report:created:yyyy-MM-dd}', context);        // "2025-07-31"
compute('{report:created:MMMM dd, yyyy}', context);     // "July 31, 2025"
compute('{report:created:dd MMM yyyy}', context);       // "31 Jul 2025"

// Day-specific formats
compute('{report:created:dddd}', context);              // "Thursday"
compute('{report:created:j}{report:created:S}', context); // "31st"
compute('{report:created:N}', context);                 // "4" (ISO day of week)

// Time formats
compute('{report:created:g:i A}', context);             // "9:42 PM"
compute('{report:created:H:i:s}', context);             // "21:42:02"

// Complex combinations
compute('Created on {report:created:dddd}, {report:created:MMMM} {report:created:j}{report:created:S}, {report:created:yyyy}', context);
// Result: "Created on Thursday, July 31st, 2025"
```

## Implementation Details

- All date parsing is done using JavaScript's native `Date` object
- Invalid dates return empty strings
- Missing/null dates return empty strings
- Time components respect UTC timezone
- Ordinal suffixes follow English conventions (1st, 2nd, 3rd, 4th, etc.)
- ISO week numbers are calculated according to ISO 8601 standard
- Day of year calculations start from 0 (PHP DateTime convention)

## Testing

The implementation has been verified to produce correct output for all supported formats using the test date `2025-07-31T21:42:02Z` which corresponds to:
- Thursday, July 31st, 2025
- 9:42:02 PM (21:42:02 in 24-hour format)
- Day 212 of the year
- Week 31 of the year
