import React, {useMemo, useRef, useState} from 'react';
import type {ImageSourcePropType, StyleProp, ViewStyle} from 'react-native';
import {View} from 'react-native';
import useNetwork from '@hooks/useNetwork';
import useThemeStyles from '@hooks/useThemeStyles';
import CONST from '@src/CONST';
import FullscreenLoadingIndicator from './FullscreenLoadingIndicator';
import Image from './Image';
import RESIZE_MODES from './Image/resizeModes';
import type {ImageObjectPosition} from './Image/types';

type ImageWithLoadingProps = {
    /** Url for image to display */
    url: string | ImageSourcePropType;

    /** alt text for the image */
    altText?: string;

    /** Any additional styles to apply */
    style?: StyleProp<ViewStyle>;

    /** Whether the image requires an authToken */
    isAuthTokenRequired: boolean;

    /** The object position of image */
    objectPosition?: ImageObjectPosition;
};

/**
 * Preloads an image by getting the size and passing dimensions via callback.
 * Image size must be provided by parent via width and height props. Useful for
 * performing some calculation on a network image after fetching dimensions so
 * it can be appropriately resized.
 */
function ImageWithLoading({url, altText, style, isAuthTokenRequired, objectPosition = CONST.IMAGE_OBJECT_POSITION.INITIAL}: ImageWithLoadingProps) {
    const styles = useThemeStyles();
    const isLoadedRef = useRef<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const {isOffline} = useNetwork();

    const source = useMemo(() => (typeof url === 'string' ? {uri: url} : url), [url]);

    const onError = () => {
        if (isOffline) {
            return;
        }
        setIsLoading(false);
    };

    const imageLoadedSuccessfully = () => {
        isLoadedRef.current = true;
        setIsLoading(false);
    };

    return (
        <View style={[styles.w100, styles.h100, style]}>
            <Image
                style={[styles.w100, styles.h100]}
                source={source}
                aria-label={altText}
                isAuthTokenRequired={isAuthTokenRequired}
                resizeMode={RESIZE_MODES.cover}
                onLoadStart={() => {
                    if (isLoadedRef.current ?? isLoading) {
                        return;
                    }
                    setIsLoading(true);
                }}
                onError={onError}
                onLoad={imageLoadedSuccessfully}
                waitForSession={() => {
                    // Called when the image should wait for a valid session to reload
                    // At the moment this function is called, the image is not in cache anymore
                    isLoadedRef.current = false;

                    setIsLoading(true);
                }}
                objectPosition={objectPosition}
            />
            {isLoading && !isOffline && (
                <FullscreenLoadingIndicator
                    iconSize="small"
                    style={[styles.opacity1, styles.bgTransparent]}
                />
            )}
        </View>
    );
}

ImageWithLoading.displayName = 'ImageWithLoading';
export default React.memo(ImageWithLoading);
