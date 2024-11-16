"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-continue */
const underscore_1 = __importDefault(require("underscore"));
const pick_1 = __importDefault(require("lodash/pick"));
const Logger = __importStar(require("./Logger"));
const OnyxCache_1 = __importStar(require("./OnyxCache"));
const PerformanceUtils = __importStar(require("./PerformanceUtils"));
const storage_1 = __importDefault(require("./storage"));
const utils_1 = __importDefault(require("./utils"));
const DevTools_1 = __importDefault(require("./DevTools"));
const OnyxUtils_1 = __importDefault(require("./OnyxUtils"));
const logMessages_1 = __importDefault(require("./logMessages"));
const OnyxConnectionManager_1 = __importDefault(require("./OnyxConnectionManager"));
/** Initialize the store with actions and listening for storage events */
function init({ keys = {}, initialKeyStates = {}, safeEvictionKeys = [], maxCachedKeysCount = 1000, shouldSyncMultipleInstances = Boolean(global.localStorage), debugSetState = false, }) {
    var _a;
    storage_1.default.init();
    if (shouldSyncMultipleInstances) {
        (_a = storage_1.default.keepInstancesSync) === null || _a === void 0 ? void 0 : _a.call(storage_1.default, (key, value) => {
            const prevValue = OnyxCache_1.default.get(key, false);
            OnyxCache_1.default.set(key, value);
            OnyxUtils_1.default.keyChanged(key, value, prevValue);
        });
    }
    if (debugSetState) {
        PerformanceUtils.setShouldDebugSetState(true);
    }
    if (maxCachedKeysCount > 0) {
        OnyxCache_1.default.setRecentKeysLimit(maxCachedKeysCount);
    }
    OnyxUtils_1.default.initStoreValues(keys, initialKeyStates, safeEvictionKeys);
    // Initialize all of our keys with data provided then give green light to any pending connections
    Promise.all([OnyxUtils_1.default.addAllSafeEvictionKeysToRecentlyAccessedList(), OnyxUtils_1.default.initializeWithDefaultKeyStates()]).then(OnyxUtils_1.default.getDeferredInitTask().resolve);
}
/**
 * Connects to an Onyx key given the options passed and listens to its changes.
 *
 * @example
 * ```ts
 * const connection = Onyx.connect({
 *     key: ONYXKEYS.SESSION,
 *     callback: onSessionChange,
 * });
 * ```
 *
 * @param connectOptions The options object that will define the behavior of the connection.
 * @param connectOptions.key The Onyx key to subscribe to.
 * @param connectOptions.callback A function that will be called when the Onyx data we are subscribed changes.
 * @param connectOptions.waitForCollectionCallback If set to `true`, it will return the entire collection to the callback as a single object.
 * @param connectOptions.withOnyxInstance The `withOnyx` class instance to be internally passed. **Only used inside `withOnyx()` HOC.**
 * @param connectOptions.statePropertyName The name of the component's prop that is connected to the Onyx key. **Only used inside `withOnyx()` HOC.**
 * @param connectOptions.displayName The component's display name. **Only used inside `withOnyx()` HOC.**
 * @param connectOptions.selector This will be used to subscribe to a subset of an Onyx key's data. **Only used inside `useOnyx()` hook or `withOnyx()` HOC.**
 *        Using this setting on `useOnyx()` or `withOnyx()` can have very positive performance benefits because the component will only re-render
 *        when the subset of data changes. Otherwise, any change of data on any property would normally
 *        cause the component to re-render (and that can be expensive from a performance standpoint).
 * @returns The connection object to use when calling `Onyx.disconnect()`.
 */
function connect(connectOptions) {
    return OnyxConnectionManager_1.default.connect(connectOptions);
}
/**
 * Disconnects and removes the listener from the Onyx key.
 *
 * @example
 * ```ts
 * const connection = Onyx.connect({
 *     key: ONYXKEYS.SESSION,
 *     callback: onSessionChange,
 * });
 *
 * Onyx.disconnect(connection);
 * ```
 *
 * @param connection Connection object returned by calling `Onyx.connect()`.
 */
function disconnect(connection) {
    OnyxConnectionManager_1.default.disconnect(connection);
}
/**
 * Write a value to our store with the given key
 *
 * @param key ONYXKEY to set
 * @param value value to store
 */
function set(key, value) {
    // When we use Onyx.set to set a key we want to clear the current delta changes from Onyx.merge that were queued
    // before the value was set. If Onyx.merge is currently reading the old value from storage, it will then not apply the changes.
    if (OnyxUtils_1.default.hasPendingMergeForKey(key)) {
        delete OnyxUtils_1.default.getMergeQueue()[key];
    }
    // Onyx.set will ignore `undefined` values as inputs, therefore we can return early.
    if (value === undefined) {
        return Promise.resolve();
    }
    const existingValue = OnyxCache_1.default.get(key, false);
    // If the existing value as well as the new value are null, we can return early.
    if (existingValue === undefined && value === null) {
        return Promise.resolve();
    }
    // Check if the value is compatible with the existing value in the storage
    const { isCompatible, existingValueType, newValueType } = utils_1.default.checkCompatibilityWithExistingValue(value, existingValue);
    if (!isCompatible) {
        Logger.logAlert(logMessages_1.default.incompatibleUpdateAlert(key, 'set', existingValueType, newValueType));
        return Promise.resolve();
    }
    // If the value is null, we remove the key from storage
    const { value: valueAfterRemoving, wasRemoved } = OnyxUtils_1.default.removeNullValues(key, value);
    const logSetCall = (hasChanged = true) => {
        // Logging properties only since values could be sensitive things we don't want to log
        Logger.logInfo(`set called for key: ${key}${underscore_1.default.isObject(value) ? ` properties: ${underscore_1.default.keys(value).join(',')}` : ''} hasChanged: ${hasChanged}`);
    };
    // Calling "OnyxUtils.removeNullValues" removes the key from storage and cache and updates the subscriber.
    // Therefore, we don't need to further broadcast and update the value so we can return early.
    if (wasRemoved) {
        logSetCall();
        return Promise.resolve();
    }
    const valueWithoutNullValues = valueAfterRemoving;
    const hasChanged = OnyxCache_1.default.hasValueChanged(key, valueWithoutNullValues);
    logSetCall(hasChanged);
    // This approach prioritizes fast UI changes without waiting for data to be stored in device storage.
    const updatePromise = OnyxUtils_1.default.broadcastUpdate(key, valueWithoutNullValues, hasChanged);
    // If the value has not changed or the key got removed, calling Storage.setItem() would be redundant and a waste of performance, so return early instead.
    if (!hasChanged) {
        return updatePromise;
    }
    return storage_1.default.setItem(key, valueWithoutNullValues)
        .catch((error) => OnyxUtils_1.default.evictStorageAndRetry(error, set, key, valueWithoutNullValues))
        .then(() => {
        OnyxUtils_1.default.sendActionToDevTools(OnyxUtils_1.default.METHOD.SET, key, valueWithoutNullValues);
        return updatePromise;
    });
}
/**
 * Sets multiple keys and values
 *
 * @example Onyx.multiSet({'key1': 'a', 'key2': 'b'});
 *
 * @param data object keyed by ONYXKEYS and the values to set
 */
function multiSet(data) {
    const keyValuePairsToSet = OnyxUtils_1.default.prepareKeyValuePairsForStorage(data, true);
    const updatePromises = keyValuePairsToSet.map(([key, value]) => {
        const prevValue = OnyxCache_1.default.get(key, false);
        // Update cache and optimistically inform subscribers on the next tick
        OnyxCache_1.default.set(key, value);
        return OnyxUtils_1.default.scheduleSubscriberUpdate(key, value, prevValue);
    });
    return storage_1.default.multiSet(keyValuePairsToSet)
        .catch((error) => OnyxUtils_1.default.evictStorageAndRetry(error, multiSet, data))
        .then(() => {
        OnyxUtils_1.default.sendActionToDevTools(OnyxUtils_1.default.METHOD.MULTI_SET, undefined, data);
        return Promise.all(updatePromises);
    })
        .then(() => undefined);
}
/**
 * Merge a new value into an existing value at a key.
 *
 * The types of values that can be merged are `Object` and `Array`. To set another type of value use `Onyx.set()`.
 * Values of type `Object` get merged with the old value, whilst for `Array`'s we simply replace the current value with the new one.
 *
 * Calls to `Onyx.merge()` are batched so that any calls performed in a single tick will stack in a queue and get
 * applied in the order they were called. Note: `Onyx.set()` calls do not work this way so use caution when mixing
 * `Onyx.merge()` and `Onyx.set()`.
 *
 * @example
 * Onyx.merge(ONYXKEYS.EMPLOYEE_LIST, ['Joe']); // -> ['Joe']
 * Onyx.merge(ONYXKEYS.EMPLOYEE_LIST, ['Jack']); // -> ['Joe', 'Jack']
 * Onyx.merge(ONYXKEYS.POLICY, {id: 1}); // -> {id: 1}
 * Onyx.merge(ONYXKEYS.POLICY, {name: 'My Workspace'}); // -> {id: 1, name: 'My Workspace'}
 */
function merge(key, changes) {
    const mergeQueue = OnyxUtils_1.default.getMergeQueue();
    const mergeQueuePromise = OnyxUtils_1.default.getMergeQueuePromise();
    // Top-level undefined values are ignored
    // Therefore, we need to prevent adding them to the merge queue
    if (changes === undefined) {
        return mergeQueue[key] ? mergeQueuePromise[key] : Promise.resolve();
    }
    // Merge attempts are batched together. The delta should be applied after a single call to get() to prevent a race condition.
    // Using the initial value from storage in subsequent merge attempts will lead to an incorrect final merged value.
    if (mergeQueue[key]) {
        mergeQueue[key].push(changes);
        return mergeQueuePromise[key];
    }
    mergeQueue[key] = [changes];
    mergeQueuePromise[key] = OnyxUtils_1.default.get(key).then((existingValue) => {
        // Calls to Onyx.set after a merge will terminate the current merge process and clear the merge queue
        if (mergeQueue[key] == null) {
            return Promise.resolve();
        }
        try {
            // We first only merge the changes, so we can provide these to the native implementation (SQLite uses only delta changes in "JSON_PATCH" to merge)
            // We don't want to remove null values from the "batchedDeltaChanges", because SQLite uses them to remove keys from storage natively.
            const validChanges = mergeQueue[key].filter((change) => {
                const { isCompatible, existingValueType, newValueType } = utils_1.default.checkCompatibilityWithExistingValue(change, existingValue);
                if (!isCompatible) {
                    Logger.logAlert(logMessages_1.default.incompatibleUpdateAlert(key, 'merge', existingValueType, newValueType));
                }
                return isCompatible;
            });
            if (!validChanges.length) {
                return Promise.resolve();
            }
            const batchedDeltaChanges = OnyxUtils_1.default.applyMerge(undefined, validChanges, false);
            // Case (1): When there is no existing value in storage, we want to set the value instead of merge it.
            // Case (2): The presence of a top-level `null` in the merge queue instructs us to drop the whole existing value.
            // In this case, we can't simply merge the batched changes with the existing value, because then the null in the merge queue would have no effect
            const shouldSetValue = !existingValue || mergeQueue[key].includes(null);
            // Clean up the write queue, so we don't apply these changes again
            delete mergeQueue[key];
            delete mergeQueuePromise[key];
            const logMergeCall = (hasChanged = true) => {
                // Logging properties only since values could be sensitive things we don't want to log
                Logger.logInfo(`merge called for key: ${key}${underscore_1.default.isObject(batchedDeltaChanges) ? ` properties: ${underscore_1.default.keys(batchedDeltaChanges).join(',')}` : ''} hasChanged: ${hasChanged}`);
            };
            // If the batched changes equal null, we want to remove the key from storage, to reduce storage size
            const { wasRemoved } = OnyxUtils_1.default.removeNullValues(key, batchedDeltaChanges);
            // Calling "OnyxUtils.removeNullValues" removes the key from storage and cache and updates the subscriber.
            // Therefore, we don't need to further broadcast and update the value so we can return early.
            if (wasRemoved) {
                logMergeCall();
                return Promise.resolve();
            }
            // For providers that can't handle delta changes, we need to merge the batched changes with the existing value beforehand.
            // The "preMergedValue" will be directly "set" in storage instead of being merged
            // Therefore we merge the batched changes with the existing value to get the final merged value that will be stored.
            // We can remove null values from the "preMergedValue", because "null" implicates that the user wants to remove a value from storage.
            const preMergedValue = OnyxUtils_1.default.applyMerge(shouldSetValue ? undefined : existingValue, [batchedDeltaChanges], true);
            // In cache, we don't want to remove the key if it's null to improve performance and speed up the next merge.
            const hasChanged = OnyxCache_1.default.hasValueChanged(key, preMergedValue);
            logMergeCall(hasChanged);
            // This approach prioritizes fast UI changes without waiting for data to be stored in device storage.
            const updatePromise = OnyxUtils_1.default.broadcastUpdate(key, preMergedValue, hasChanged);
            // If the value has not changed, calling Storage.setItem() would be redundant and a waste of performance, so return early instead.
            if (!hasChanged) {
                return updatePromise;
            }
            return storage_1.default.mergeItem(key, batchedDeltaChanges, preMergedValue, shouldSetValue).then(() => {
                OnyxUtils_1.default.sendActionToDevTools(OnyxUtils_1.default.METHOD.MERGE, key, changes, preMergedValue);
                return updatePromise;
            });
        }
        catch (error) {
            Logger.logAlert(`An error occurred while applying merge for key: ${key}, Error: ${error}`);
            return Promise.resolve();
        }
    });
    return mergeQueuePromise[key];
}
/**
 * Merges a collection based on their keys
 *
 * @example
 *
 * Onyx.mergeCollection(ONYXKEYS.COLLECTION.REPORT, {
 *     [`${ONYXKEYS.COLLECTION.REPORT}1`]: report1,
 *     [`${ONYXKEYS.COLLECTION.REPORT}2`]: report2,
 * });
 *
 * @param collectionKey e.g. `ONYXKEYS.COLLECTION.REPORT`
 * @param collection Object collection keyed by individual collection member keys and values
 */
function mergeCollection(collectionKey, collection) {
    if (!OnyxUtils_1.default.isValidNonEmptyCollectionForMerge(collection)) {
        Logger.logInfo('mergeCollection() called with invalid or empty value. Skipping this update.');
        return Promise.resolve();
    }
    const mergedCollection = collection;
    // Confirm all the collection keys belong to the same parent
    const mergedCollectionKeys = Object.keys(mergedCollection);
    if (!OnyxUtils_1.default.doAllCollectionItemsBelongToSameParent(collectionKey, mergedCollectionKeys)) {
        return Promise.resolve();
    }
    return OnyxUtils_1.default.getAllKeys()
        .then((persistedKeys) => {
        // Split to keys that exist in storage and keys that don't
        const keys = mergedCollectionKeys.filter((key) => {
            if (mergedCollection[key] === null) {
                OnyxUtils_1.default.remove(key);
                return false;
            }
            return true;
        });
        const existingKeys = keys.filter((key) => persistedKeys.has(key));
        const cachedCollectionForExistingKeys = OnyxUtils_1.default.getCachedCollection(collectionKey, existingKeys);
        const existingKeyCollection = existingKeys.reduce((obj, key) => {
            const { isCompatible, existingValueType, newValueType } = utils_1.default.checkCompatibilityWithExistingValue(mergedCollection[key], cachedCollectionForExistingKeys[key]);
            if (!isCompatible) {
                Logger.logAlert(logMessages_1.default.incompatibleUpdateAlert(key, 'mergeCollection', existingValueType, newValueType));
                return obj;
            }
            // eslint-disable-next-line no-param-reassign
            obj[key] = mergedCollection[key];
            return obj;
        }, {});
        const newCollection = {};
        keys.forEach((key) => {
            if (persistedKeys.has(key)) {
                return;
            }
            newCollection[key] = mergedCollection[key];
        });
        // When (multi-)merging the values with the existing values in storage,
        // we don't want to remove nested null values from the data that we pass to the storage layer,
        // because the storage layer uses them to remove nested keys from storage natively.
        const keyValuePairsForExistingCollection = OnyxUtils_1.default.prepareKeyValuePairsForStorage(existingKeyCollection, false);
        // We can safely remove nested null values when using (multi-)set,
        // because we will simply overwrite the existing values in storage.
        const keyValuePairsForNewCollection = OnyxUtils_1.default.prepareKeyValuePairsForStorage(newCollection, true);
        const promises = [];
        // We need to get the previously existing values so we can compare the new ones
        // against them, to avoid unnecessary subscriber updates.
        const previousCollectionPromise = Promise.all(existingKeys.map((key) => OnyxUtils_1.default.get(key).then((value) => [key, value]))).then(Object.fromEntries);
        // New keys will be added via multiSet while existing keys will be updated using multiMerge
        // This is because setting a key that doesn't exist yet with multiMerge will throw errors
        if (keyValuePairsForExistingCollection.length > 0) {
            promises.push(storage_1.default.multiMerge(keyValuePairsForExistingCollection));
        }
        if (keyValuePairsForNewCollection.length > 0) {
            promises.push(storage_1.default.multiSet(keyValuePairsForNewCollection));
        }
        // finalMergedCollection contains all the keys that were merged, without the keys of incompatible updates
        const finalMergedCollection = Object.assign(Object.assign({}, existingKeyCollection), newCollection);
        // Prefill cache if necessary by calling get() on any existing keys and then merge original data to cache
        // and update all subscribers
        const promiseUpdate = previousCollectionPromise.then((previousCollection) => {
            OnyxCache_1.default.merge(finalMergedCollection);
            return OnyxUtils_1.default.scheduleNotifyCollectionSubscribers(collectionKey, finalMergedCollection, previousCollection);
        });
        return Promise.all(promises)
            .catch((error) => OnyxUtils_1.default.evictStorageAndRetry(error, mergeCollection, collectionKey, mergedCollection))
            .then(() => {
            OnyxUtils_1.default.sendActionToDevTools(OnyxUtils_1.default.METHOD.MERGE_COLLECTION, undefined, mergedCollection);
            return promiseUpdate;
        });
    })
        .then(() => undefined);
}
/**
 * Clear out all the data in the store
 *
 * Note that calling Onyx.clear() and then Onyx.set() on a key with a default
 * key state may store an unexpected value in Storage.
 *
 * E.g.
 * Onyx.clear();
 * Onyx.set(ONYXKEYS.DEFAULT_KEY, 'default');
 * Storage.getItem(ONYXKEYS.DEFAULT_KEY)
 *     .then((storedValue) => console.log(storedValue));
 * null is logged instead of the expected 'default'
 *
 * Onyx.set() might call Storage.setItem() before Onyx.clear() calls
 * Storage.setItem(). Use Onyx.merge() instead if possible. Onyx.merge() calls
 * Onyx.get(key) before calling Storage.setItem() via Onyx.set().
 * Storage.setItem() from Onyx.clear() will have already finished and the merged
 * value will be saved to storage after the default value.
 *
 * @param keysToPreserve is a list of ONYXKEYS that should not be cleared with the rest of the data
 */
function clear(keysToPreserve = []) {
    const defaultKeyStates = OnyxUtils_1.default.getDefaultKeyStates();
    const initialKeys = Object.keys(defaultKeyStates);
    const promise = OnyxUtils_1.default.getAllKeys()
        .then((cachedKeys) => {
        OnyxCache_1.default.clearNullishStorageKeys();
        const keysToBeClearedFromStorage = [];
        const keyValuesToResetAsCollection = {};
        const keyValuesToResetIndividually = {};
        const allKeys = new Set([...cachedKeys, ...initialKeys]);
        // The only keys that should not be cleared are:
        // 1. Anything specifically passed in keysToPreserve (because some keys like language preferences, offline
        //      status, or activeClients need to remain in Onyx even when signed out)
        // 2. Any keys with a default state (because they need to remain in Onyx as their default, and setting them
        //      to null would cause unknown behavior)
        //   2.1 However, if a default key was explicitly set to null, we need to reset it to the default value
        allKeys.forEach((key) => {
            var _a;
            const isKeyToPreserve = keysToPreserve.includes(key);
            const isDefaultKey = key in defaultKeyStates;
            // If the key is being removed or reset to default:
            // 1. Update it in the cache
            // 2. Figure out whether it is a collection key or not,
            //      since collection key subscribers need to be updated differently
            if (!isKeyToPreserve) {
                const oldValue = OnyxCache_1.default.get(key);
                const newValue = (_a = defaultKeyStates[key]) !== null && _a !== void 0 ? _a : null;
                if (newValue !== oldValue) {
                    OnyxCache_1.default.set(key, newValue);
                    let collectionKey;
                    try {
                        collectionKey = OnyxUtils_1.default.getCollectionKey(key);
                    }
                    catch (e) {
                        // If getCollectionKey() throws an error it means the key is not a collection key.
                        collectionKey = undefined;
                    }
                    if (collectionKey) {
                        if (!keyValuesToResetAsCollection[collectionKey]) {
                            keyValuesToResetAsCollection[collectionKey] = {};
                        }
                        keyValuesToResetAsCollection[collectionKey][key] = newValue !== null && newValue !== void 0 ? newValue : undefined;
                    }
                    else {
                        keyValuesToResetIndividually[key] = newValue !== null && newValue !== void 0 ? newValue : undefined;
                    }
                }
            }
            if (isKeyToPreserve || isDefaultKey) {
                return;
            }
            // If it isn't preserved and doesn't have a default, we'll remove it
            keysToBeClearedFromStorage.push(key);
        });
        const updatePromises = [];
        // Notify the subscribers for each key/value group so they can receive the new values
        Object.entries(keyValuesToResetIndividually).forEach(([key, value]) => {
            updatePromises.push(OnyxUtils_1.default.scheduleSubscriberUpdate(key, value, OnyxCache_1.default.get(key, false)));
        });
        Object.entries(keyValuesToResetAsCollection).forEach(([key, value]) => {
            updatePromises.push(OnyxUtils_1.default.scheduleNotifyCollectionSubscribers(key, value));
        });
        const defaultKeyValuePairs = Object.entries(Object.keys(defaultKeyStates)
            .filter((key) => !keysToPreserve.includes(key))
            .reduce((obj, key) => {
            // eslint-disable-next-line no-param-reassign
            obj[key] = defaultKeyStates[key];
            return obj;
        }, {}));
        // Remove only the items that we want cleared from storage, and reset others to default
        keysToBeClearedFromStorage.forEach((key) => OnyxCache_1.default.drop(key));
        return storage_1.default.removeItems(keysToBeClearedFromStorage)
            .then(() => OnyxConnectionManager_1.default.refreshSessionID())
            .then(() => storage_1.default.multiSet(defaultKeyValuePairs))
            .then(() => {
            DevTools_1.default.clearState(keysToPreserve);
            return Promise.all(updatePromises);
        });
    })
        .then(() => undefined);
    return OnyxCache_1.default.captureTask(OnyxCache_1.TASK.CLEAR, promise);
}
function addSnapshots(data) {
    const snapshotCollectionKey = OnyxUtils_1.default.getSnapshotKey();
    if (!snapshotCollectionKey)
        return;
    const promises = [];
    const snapshotCollection = OnyxUtils_1.default.getCachedCollection(snapshotCollectionKey);
    const snapshotCollectionKeyLength = snapshotCollectionKey.length;

    Object.entries(snapshotCollection).forEach(([snapshotKey, snapshotValue]) => {
        // Snapshots may not be present in cache. We don't know how to update them so we skip.
        if (!snapshotValue) {
            return;
        }
        let addedData = {};
        data.forEach(({ key, value }) => {
            // snapshots are normal keys so we want to skip update if they are written to Onyx
            if (OnyxUtils_1.default.isCollectionMemberKey(snapshotCollectionKey, key, snapshotCollectionKeyLength)) {
                return;
            }
            if (typeof snapshotValue !== 'object' || !('data' in snapshotValue)) {
                return;
            }
            const snapshotData = snapshotValue.data;
            if (!snapshotData || !snapshotData[key]) {
                return;
            }

            let newValue = {};

            // Check if snapshotData contains the key and has values
            if (snapshotData[key] && Object.keys(snapshotData[key]).length > 0) {
                const firstValueKey = Object.keys(value)[0];
                const snapshotKeys = Object.keys(snapshotData[key]);

                // Check if the first key in `value` doesn't exist in `snapshotData[key]`
                if (!snapshotKeys.includes(firstValueKey)) {
                    const existingValue = Object.values(snapshotData[key])[0];
                    const newValues = Object.values(value)[0];

                    // Update `existingValue` with matching keys from `newValues`
                    Object.keys(newValues).forEach(subKey => {
                        if (subKey in existingValue) {
                            existingValue[subKey] = newValues[subKey];
                        }
                    });

                    newValue = existingValue;
                }
            }

            addedData = {
                ...addedData,
                [key]: newValue,
            };

        });
        // Skip the update if there's no data to be merged
        if (utils_1.default.isEmptyObject(addedData)) {
            return;
        }
       
        
        promises.push(() => merge(snapshotKey, { data: addedData }));
    });
    return Promise.all(promises.map((p) => p()));
}
function updateSnapshots(data) {
    const snapshotCollectionKey = OnyxUtils_1.default.getSnapshotKey();
    if (!snapshotCollectionKey)
        return;
    const promises = [];
    const snapshotCollection = OnyxUtils_1.default.getCachedCollection(snapshotCollectionKey);
    const snapshotCollectionKeyLength = snapshotCollectionKey.length;

    Object.entries(snapshotCollection).forEach(([snapshotKey, snapshotValue]) => {
        // Snapshots may not be present in cache. We don't know how to update them so we skip.
        if (!snapshotValue) {
            return;
        }
        let updatedData = {};
        data.forEach(({ key, value }) => {
            // snapshots are normal keys so we want to skip update if they are written to Onyx
            if (OnyxUtils_1.default.isCollectionMemberKey(snapshotCollectionKey, key, snapshotCollectionKeyLength)) {
                return;
            }
            if (typeof snapshotValue !== 'object' || !('data' in snapshotValue)) {
                return;
            }
            const snapshotData = snapshotValue.data;
            if (!snapshotData || !snapshotData[key]) {
                return;
            }
            const oldValue = updatedData[key] || {};
            let newValue = (0, pick_1.default)(value, Object.keys(snapshotData[key]));
            
            updatedData = Object.assign(Object.assign({}, updatedData), { [key]: Object.assign(oldValue, newValue) });
        });
        // Skip the update if there's no data to be merged
        if (utils_1.default.isEmptyObject(updatedData)) {
            return;
        }
        
        promises.push(() => merge(snapshotKey, { data: updatedData }));
    });
    return Promise.all(promises.map((p) => p()));
}
/**
 * Insert API responses and lifecycle data into Onyx
 *
 * @param data An array of objects with update expressions
 * @returns resolves when all operations are complete
 */
function update(data) {
    // First, validate the Onyx object is in the format we expect
    data.forEach(({ onyxMethod, key, value }) => {
        if (![OnyxUtils_1.default.METHOD.CLEAR, OnyxUtils_1.default.METHOD.SET, OnyxUtils_1.default.METHOD.MERGE, OnyxUtils_1.default.METHOD.MERGE_COLLECTION, OnyxUtils_1.default.METHOD.MULTI_SET].includes(onyxMethod)) {
            throw new Error(`Invalid onyxMethod ${onyxMethod} in Onyx update.`);
        }
        if (onyxMethod === OnyxUtils_1.default.METHOD.MULTI_SET) {
            // For multiset, we just expect the value to be an object
            if (typeof value !== 'object' || Array.isArray(value) || typeof value === 'function') {
                throw new Error('Invalid value provided in Onyx multiSet. Onyx multiSet value must be of type object.');
            }
        }
        else if (onyxMethod !== OnyxUtils_1.default.METHOD.CLEAR && typeof key !== 'string') {
            throw new Error(`Invalid ${typeof key} key provided in Onyx update. Onyx key must be of type string.`);
        }
    });
    // The queue of operations within a single `update` call in the format of <item key - list of operations updating the item>.
    // This allows us to batch the operations per item and merge them into one operation in the order they were requested.
    const updateQueue = {};
    const enqueueSetOperation = (key, value) => {
        // If a `set` operation is enqueued, we should clear the whole queue.
        // Since the `set` operation replaces the value entirely, there's no need to perform any previous operations.
        // To do this, we first put `null` in the queue, which removes the existing value, and then merge the new value.
        updateQueue[key] = [null, value];
    };
    const enqueueMergeOperation = (key, value) => {
        if (value === null) {
            // If we merge `null`, the value is removed and all the previous operations are discarded.
            updateQueue[key] = [null];
        }
        else if (!updateQueue[key]) {
            updateQueue[key] = [value];
        }
        else {
            updateQueue[key].push(value);
        }
    };
    const promises = [];
    let clearPromise = Promise.resolve();
    data.forEach(({ onyxMethod, key, value }) => {
        switch (onyxMethod) {
            case OnyxUtils_1.default.METHOD.SET:
                enqueueSetOperation(key, value);
                break;
            case OnyxUtils_1.default.METHOD.MERGE:
                enqueueMergeOperation(key, value);
                break;
            case OnyxUtils_1.default.METHOD.MERGE_COLLECTION: {
                const collection = value;
                if (!OnyxUtils_1.default.isValidNonEmptyCollectionForMerge(collection)) {
                    Logger.logInfo('mergeCollection enqueued within update() with invalid or empty value. Skipping this operation.');
                    break;
                }
                // Confirm all the collection keys belong to the same parent
                const collectionKeys = Object.keys(collection);
                if (OnyxUtils_1.default.doAllCollectionItemsBelongToSameParent(key, collectionKeys)) {
                    const mergedCollection = collection;
                    collectionKeys.forEach((collectionKey) => enqueueMergeOperation(collectionKey, mergedCollection[collectionKey]));
                }
                break;
            }
            case OnyxUtils_1.default.METHOD.MULTI_SET:
                Object.entries(value).forEach(([entryKey, entryValue]) => enqueueSetOperation(entryKey, entryValue));
                break;
            case OnyxUtils_1.default.METHOD.CLEAR:
                clearPromise = clear();
                break;
            default:
                break;
        }
    });
    // Group all the collection-related keys and update each collection in a single `mergeCollection` call.
    // This is needed to prevent multiple `mergeCollection` calls for the same collection and `merge` calls for the individual items of the said collection.
    // This way, we ensure there is no race condition in the queued updates of the same key.
    OnyxUtils_1.default.getCollectionKeys().forEach((collectionKey) => {
        const collectionItemKeys = Object.keys(updateQueue).filter((key) => OnyxUtils_1.default.isKeyMatch(collectionKey, key));
        if (collectionItemKeys.length <= 1) {
            // If there are no items of this collection in the updateQueue, we should skip it.
            // If there is only one item, we should update it individually, therefore retain it in the updateQueue.
            return;
        }
        const batchedCollectionUpdates = collectionItemKeys.reduce((queue, key) => {
            const operations = updateQueue[key];
            // Remove the collection-related key from the updateQueue so that it won't be processed individually.
            delete updateQueue[key];
            const updatedValue = OnyxUtils_1.default.applyMerge(undefined, operations, false);
            if (operations[0] === null) {
                // eslint-disable-next-line no-param-reassign
                queue.set[key] = updatedValue;
            }
            else {
                // eslint-disable-next-line no-param-reassign
                queue.merge[key] = updatedValue;
            }
            return queue;
        }, {
            merge: {},
            set: {},
        });
        if (!utils_1.default.isEmptyObject(batchedCollectionUpdates.merge)) {
            promises.push(() => mergeCollection(collectionKey, batchedCollectionUpdates.merge));
        }
        if (!utils_1.default.isEmptyObject(batchedCollectionUpdates.set)) {
            promises.push(() => multiSet(batchedCollectionUpdates.set));
        }
    });
    Object.entries(updateQueue).forEach(([key, operations]) => {
        const batchedChanges = OnyxUtils_1.default.applyMerge(undefined, operations, false);
        if (operations[0] === null) {
            promises.push(() => set(key, batchedChanges));
        }
        else {
            promises.push(() => merge(key, batchedChanges));
        }
    });
    return clearPromise
        .then(() => Promise.all(promises.map((p) => p())))
        .then(() => addSnapshots(data))
        .then(() => updateSnapshots(data))
        .then(() => undefined);
}
const Onyx = {
    METHOD: OnyxUtils_1.default.METHOD,
    connect,
    disconnect,
    set,
    multiSet,
    merge,
    mergeCollection,
    update,
    clear,
    init,
    registerLogger: Logger.registerLogger,
};
exports.default = Onyx;
