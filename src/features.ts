import { RawEvent, EVENT_CATEGORIES, INPUT_DIM } from './types';

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
export class FeatureExtractor {
  private lastTimestamp = 0;

  extract(event: RawEvent): Float32Array {
    const features = new Float32Array(INPUT_DIM);

    const categoryIdx = EVENT_CATEGORIES.indexOf(event.category);
    if (categoryIdx >= 0) {
      features[categoryIdx] = 1.0;
    }

    features[8] = event.viewportWidth > 0
      ? clamp(event.x / event.viewportWidth, 0, 1)
      : 0;

    features[9] = event.viewportHeight > 0
      ? clamp(event.y / event.viewportHeight, 0, 1)
      : 0;

    const timeDelta = this.lastTimestamp > 0
      ? event.timestamp - this.lastTimestamp
      : 0;
    this.lastTimestamp = event.timestamp;

    features[10] = clamp(logScale(timeDelta, 10000), -1, 1);

    features[11] = clamp(event.scrollDeltaY / 5000, -1, 1);

    features[12] = clamp(logScale(event.keystrokeInterval, 2000), -1, 1);

    features[13] = event.targetTagIndex / 8;

    features[14] = event.viewportHeight > 0
      ? clamp(event.viewportWidth / event.viewportHeight / 3, 0, 1)
      : 0.5;

    const velocity = timeDelta > 0 ? 1 / (1 + timeDelta / 100) : 0;
    features[15] = clamp(velocity, 0, 1);

    return features;
  }

  reset(): void {
    this.lastTimestamp = 0;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function logScale(value: number, maxValue: number): number {
  if (value <= 0) return 0;
  return Math.log1p(value) / Math.log1p(maxValue) * 2 - 1;
}
