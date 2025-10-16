import React from 'react';
import {Text, View} from 'react-native';
import {useReportActionsListHelpers} from './ReportActionsListContext';

// Test component to verify context is working
export const TestContextComponent: React.FC = () => {
    const reportActionsListHelpers = useReportActionsListHelpers();

    console.log('TestContextComponent context:', {
        hasHelpers: !!reportActionsListHelpers,
        helperKeys: reportActionsListHelpers ? Object.keys(reportActionsListHelpers) : 'no helpers',
        hasGetOffsetByIndex: !!reportActionsListHelpers?.getOffsetByIndex,
    });

    return (
        <View>
            <Text>Context Test: {reportActionsListHelpers ? 'Available' : 'Not Available'}</Text>
        </View>
    );
};

export default TestContextComponent;
