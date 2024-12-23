import React, {useContext, useMemo, useState} from 'react';
import type ChildrenProps from './types/utils/ChildrenProps';

type BlurStateContextType = {
    blurState: boolean;
    setBlurState: React.Dispatch<React.SetStateAction<boolean>>;
};

const BlurContext = React.createContext<BlurStateContextType>({
    blurState: true,
    setBlurState: () => {},
});

function BlurContextProvider({children}: ChildrenProps) {
    const [blurState, setBlurState] = useState<boolean>(true);
    const blurContext = useMemo(
        () => ({
            blurState,
            setBlurState,
        }),
        [blurState],
    );

    return <BlurContext.Provider value={blurContext}>{children}</BlurContext.Provider>;
}

function useBlurContext() {
    return useContext(BlurContext);
}

export default BlurContext;
export {BlurContextProvider, useBlurContext as useMaxHeightContext};
