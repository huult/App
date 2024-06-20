type PDFState = {
    canOpen: boolean;
    error?: Error;
    errorMessage?: 'password' | 'unknown';
};
