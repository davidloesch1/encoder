export type EventCategory = 'mousemove' | 'click' | 'scroll' | 'keypress' | 'input' | 'submit' | 'navigation' | 'visibility';
export interface RawEvent {
    category: EventCategory;
    timestamp: number;
    x: number;
    y: number;
    viewportWidth: number;
    viewportHeight: number;
    scrollDeltaY: number;
    keystrokeInterval: number;
    targetTagIndex: number;
}
export type TriggerType = 'interval' | 'event_count' | 'session_end' | 'manual';
export interface FingerprintPayload {
    fingerprint: number[];
    timestamp: number;
    sessionId: string;
    triggerType: TriggerType;
}
export interface EncoderConfig {
    interval: number;
    eventCount: number;
    eventName: string;
    sessionId?: string;
}
export declare const DEFAULT_CONFIG: EncoderConfig;
export declare const EVENT_CATEGORIES: EventCategory[];
export declare const INPUT_DIM = 16;
export declare const HIDDEN_DIM = 32;
