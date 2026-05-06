export type EventCategory =
  | 'mousemove'
  | 'click'
  | 'scroll'
  | 'keypress'
  | 'input'
  | 'submit'
  | 'navigation'
  | 'visibility';

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
  destination: string;
  interval: number;
  eventCount: number;
  eventName: string;
  headers: Record<string, string>;
  sessionId?: string;
}

export const DEFAULT_CONFIG: EncoderConfig = {
  destination: 'fullstory',
  interval: 30000,
  eventCount: 100,
  eventName: 'Fingerprint Generated',
  headers: {},
};

export const EVENT_CATEGORIES: EventCategory[] = [
  'mousemove',
  'click',
  'scroll',
  'keypress',
  'input',
  'submit',
  'navigation',
  'visibility',
];

export const INPUT_DIM = 16;
export const HIDDEN_DIM = 32;
