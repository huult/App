// Simple test of applyMiddleTruncationToCardName function
function applyMiddleTruncationToCardName(cardName, maxLength = 30) {
    if (!cardName || cardName.length <= maxLength) {
        return cardName;
    }

    // Extract the last 4 digits from the card name (common pattern: "ending in XXXX" or just "XXXX")
    const lastFourMatch = cardName.match(/(\d{4})(?:\s*$|$)/);
    const lastFour = lastFourMatch ? lastFourMatch[1] : '';

    if (lastFour) {
        // If we have last 4 digits, preserve them
        const prefixLength = Math.floor((maxLength - 3 - lastFour.length) * 0.7); // 70% for prefix
        const prefix = cardName.substring(0, prefixLength).trim();
        return `${prefix}...${lastFour}`;
    }

    // Standard middle truncation without specific pattern
    const prefixLength = Math.floor((maxLength - 3) / 2);
    const suffixLength = maxLength - 3 - prefixLength;
    const prefix = cardName.substring(0, prefixLength).trim();
    const suffix = cardName.substring(cardName.length - suffixLength).trim();
    return `${prefix}...${suffix}`;
}

// Test cases
console.log('Testing applyMiddleTruncationToCardName function...\n');

const testCases = [
    'Chase Visa', // Short name, no truncation
    'American Express Platinum Corporate Card ending in 5678', // Long with digits
    'Very Long Credit Card Account Name Without Numbers', // Long without digits
    'American Express Business Gold Card ending in 1234', // Another with digits
    'Corporate Credit Card Account 9876', // Digits at end
    '',
];

testCases.forEach((testCase, index) => {
    const result = applyMiddleTruncationToCardName(testCase, 30);
    console.log(`Test ${index + 1}:`);
    console.log(`  Input:  "${testCase}"`);
    console.log(`  Output: "${result}"`);
    console.log(`  Length: ${result.length}`);
    console.log('');
});
