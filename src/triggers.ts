import { TriggerType } from './types';

export type TriggerCallback = (triggerType: TriggerType) => void;

export class TriggerManager {
  private intervalTimer: ReturnType<typeof setInterval> | null = null;
  private eventCounter = 0;
  private callback: TriggerCallback;
  private intervalMs: number;
  private eventCountThreshold: number;
  private paused = false;

  constructor(
    callback: TriggerCallback,
    intervalMs: number,
    eventCountThreshold: number,
  ) {
    this.callback = callback;
    this.intervalMs = intervalMs;
    this.eventCountThreshold = eventCountThreshold;
  }

  start(): void {
    this.startInterval();
    this.bindSessionEnd();
  }

  stop(): void {
    this.stopInterval();
    this.unbindSessionEnd();
  }

  pause(): void {
    this.paused = true;
    this.stopInterval();
  }

  resume(): void {
    this.paused = false;
    this.startInterval();
  }

  recordEvent(): void {
    if (this.paused) return;
    this.eventCounter++;
    if (this.eventCountThreshold > 0 && this.eventCounter >= this.eventCountThreshold) {
      this.eventCounter = 0;
      this.callback('event_count');
    }
  }

  private startInterval(): void {
    if (this.intervalMs <= 0 || this.intervalTimer !== null) return;
    this.intervalTimer = setInterval(() => {
      if (!this.paused) {
        this.callback('interval');
      }
    }, this.intervalMs);
  }

  private stopInterval(): void {
    if (this.intervalTimer !== null) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  private onBeforeUnload = (): void => {
    this.callback('session_end');
  };

  private onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      this.callback('session_end');
    }
  };

  private bindSessionEnd(): void {
    window.addEventListener('beforeunload', this.onBeforeUnload);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  private unbindSessionEnd(): void {
    window.removeEventListener('beforeunload', this.onBeforeUnload);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }
}
