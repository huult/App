import * as pdfjs from 'pdfjs-dist';
import type PDFState from './types';

const checkPDFState = async (source: {url: string}): Promise<PDFState> => {
    try {
        await pdfjs.getDocument(source).promise;
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

export default checkPDFState;
