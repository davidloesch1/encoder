import { FingerprintPayload, TriggerType } from './types';

declare global {
  interface Window {
    FS?: (command: string, payload: Record<string, unknown>) => void;
  }
}

export type Destination =
  | { type: 'fullstory'; eventName: string }
  | { type: 'http'; endpoint: string; headers: Record<string, string> };

export function parseDestination(raw: string, eventName: string, headers: Record<string, string>): Destination {
  const lower = raw.trim().toLowerCase();
  if (lower === 'fullstory' || lower === 'fs') {
    return { type: 'fullstory', eventName };
  }
  return { type: 'http', endpoint: raw.trim(), headers };
}

export class FingerprintSender {
  private sessionId: string;
  private destination: Destination;

  constructor(sessionId: string, destination: Destination) {
    this.sessionId = sessionId;
    this.destination = destination;
  }

  send(fingerprint: Float32Array, triggerType: TriggerType): void {
    if (this.destination.type === 'fullstory') {
      this.sendToFullStory(fingerprint, triggerType);
    } else {
      this.sendToHttp(fingerprint, triggerType);
    }
  }

  private sendToFullStory(fingerprint: Float32Array, triggerType: TriggerType): void {
    const FS = window.FS;
    if (!FS) return;

    const fp = Array.from(fingerprint);
    const properties: Record<string, unknown> = {
      sessionId: this.sessionId,
      triggerType,
      dimensions: fp.length,
      timestamp: Date.now(),
    };

    for (let i = 0; i < fp.length; i++) {
      properties[`d${i}`] = Math.round(fp[i] * 1000000) / 1000000;
    }

    FS('trackEvent', {
      name: (this.destination as { eventName: string }).eventName,
      properties,
    });
  }

  private sendToHttp(fingerprint: Float32Array, triggerType: TriggerType): void {
    const dest = this.destination as { endpoint: string; headers: Record<string, string> };
    if (!dest.endpoint) return;

    const payload: FingerprintPayload = {
      fingerprint: Array.from(fingerprint),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      triggerType,
    };

    if (triggerType === 'session_end') {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(dest.endpoint, blob);
      } else {
        this.postFetch(dest, payload);
      }
    } else {
      this.postFetch(dest, payload);
    }
  }

  private postFetch(dest: { endpoint: string; headers: Record<string, string> }, payload: FingerprintPayload): void {
    fetch(dest.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...dest.headers },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }
}
