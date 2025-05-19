import type SetCursorPosition from './types';

const setCursorPosition: SetCursorPosition = (position, ref, setSelection, isFocus = true) => {
    setSelection({
        start: position,
        end: position,
    });
    isFocus && ref.current?.focus();
};

export default setCursorPosition;
