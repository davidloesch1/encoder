import { FingerprintPayload, TriggerType } from './types';

export class FingerprintSender {
  private endpoint: string;
  private headers: Record<string, string>;
  private sessionId: string;

  constructor(endpoint: string, headers: Record<string, string>, sessionId: string) {
    this.endpoint = endpoint;
    this.headers = headers;
    this.sessionId = sessionId;
  }

  send(fingerprint: Float32Array, triggerType: TriggerType): void {
    if (!this.endpoint) return;

    const payload: FingerprintPayload = {
      fingerprint: Array.from(fingerprint),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      triggerType,
    };

    if (triggerType === 'session_end') {
      this.sendBeacon(payload);
    } else {
      this.sendFetch(payload);
    }
  }

  private sendBeacon(payload: FingerprintPayload): void {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(this.endpoint, blob);
    } else {
      this.sendFetch(payload);
    }
  }

  private sendFetch(payload: FingerprintPayload): void {
    const body = JSON.stringify(payload);
    fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
      },
      body,
      keepalive: true,
    }).catch(() => {
      // Silently fail - fingerprint delivery is best-effort
    });
  }

  updateEndpoint(endpoint: string): void {
    this.endpoint = endpoint;
  }

  updateHeaders(headers: Record<string, string>): void {
    this.headers = headers;
  }
}
