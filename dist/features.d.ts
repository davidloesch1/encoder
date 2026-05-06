import { RawEvent } from './types';
/**
 * Converts a RawEvent into a fixed-size numeric feature vector of length INPUT_DIM (16).
 *
 * Layout:
 *   [0..7]  - one-hot event category (8 dims)
 *   [8]     - normalized x position (0-1)
 *   [9]     - normalized y position (0-1)
 *   [10]    - log-scaled time delta since last event
 *   [11]    - normalized scroll delta
 *   [12]    - normalized keystroke interval
 *   [13]    - normalized target tag index
 *   [14]    - viewport aspect ratio
 *   [15]    - event velocity (inverse of time delta)
 */
export declare class FeatureExtractor {
    private lastTimestamp;
    extract(event: RawEvent): Float32Array;
    reset(): void;
}
