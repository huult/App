// Example usage of the enhanced Formula date formatting
import { compute } from './src/libs/Formula';

// Example report context
const exampleContext = {
    report: {
        reportID: 'test123',
        type: 'expense',
        total: 12345, // $123.45
        currency: 'USD',
        created: '2025-07-31T21:42:02Z'
    },
    policy: {
        name: 'My Company Policy'
    }
};

// Examples of using different date formats in formulas
const examples = [
    // Basic date formats
    { formula: 'Report created on {report:created:yyyy-MM-dd}', description: 'ISO date format' },
    { formula: 'Report created on {report:created:MMMM dd, yyyy}', description: 'Full month name' },
    { formula: 'Report created on {report:created:dd MMM yyyy}', description: 'Short month name' },
    { formula: 'Report created on {report:created:M/dd/yyyy}', description: 'US date format' },
    
    // Day-specific formats
    { formula: 'Created on {report:created:dddd}, {report:created:MMMM} {report:created:j}{report:created:S}', description: 'Full day name with ordinal' },
    { formula: 'Day of week: {report:created:N} (ISO), {report:created:w} (US)', description: 'Day of week numbers' },
    { formula: 'Day {report:created:z} of the year', description: 'Day of year' },
    
    // Time formats
    { formula: 'Created at {report:created:g}:{report:created:mm} {report:created:A}', description: '12-hour time' },
    { formula: 'Created at {report:created:H}:{report:created:mm}:{report:created:ss}', description: '24-hour time' },
    
    // Complex formats
    { formula: 'Expense Report for {report:created:MMMM, yyyy} - Week {report:created:W}', description: 'Month/year with week number' },
    { formula: '{report:policyname} - {report:type|frontPart} ({report:currency}{report:total}) - {report:created:dd/MM/yy}', description: 'Combined with other formula parts' },
];

console.log('Formula Date Format Examples');
console.log('============================\n');

examples.forEach((example, index) => {
    try {
        const result = compute(example.formula, exampleContext);
        console.log(`${index + 1}. ${example.description}:`);
        console.log(`   Formula: ${example.formula}`);
        console.log(`   Result:  ${result}\n`);
    } catch (error) {
        console.log(`${index + 1}. ${example.description}: ERROR - ${error.message}\n`);
    }
});
