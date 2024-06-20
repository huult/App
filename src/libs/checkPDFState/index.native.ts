import PdfManager from 'react-native-pdf/PdfManager';
import type PDFState from './types';

const checkPDFState = async (source: {url: string}): Promise<PDFState> => {
    const path = unescape(source.url.replace(/file:\/\//i, ''));
    try {
        await PdfManager.loadFile(path);
        console.log(`___________ Success ___________`);
        return {canOpen: true};
    } catch (e: unknown) {
        const error = e as Error;
        console.log(`___________ Error ___________`, error);
        if (error?.message?.match(/password/i)) {
            return {canOpen: false, errorMessage: 'password', error};
        }
        return {canOpen: false, errorMessage: 'unknown', error};
    }
};
