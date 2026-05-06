import { TriggerType } from './types';

declare global {
  interface Window {
    FS?: (command: string, payload: Record<string, unknown>) => void;
  }
}

export class FingerprintSender {
  private sessionId: string;
  private eventName: string;

  constructor(sessionId: string, eventName = 'Fingerprint Generated') {
    this.sessionId = sessionId;
    this.eventName = eventName;
  }

  send(fingerprint: Float32Array, triggerType: TriggerType): void {
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
      name: this.eventName,
      properties,
    });
  }
}
