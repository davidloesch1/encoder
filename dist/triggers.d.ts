import { TriggerType } from './types';
export type TriggerCallback = (triggerType: TriggerType) => void;
export declare class TriggerManager {
    private intervalTimer;
    private eventCounter;
    private callback;
    private intervalMs;
    private eventCountThreshold;
    private paused;
    constructor(callback: TriggerCallback, intervalMs: number, eventCountThreshold: number);
    start(): void;
    stop(): void;
    pause(): void;
    resume(): void;
    recordEvent(): void;
    private startInterval;
    private stopInterval;
    private onBeforeUnload;
    private onVisibilityChange;
    private bindSessionEnd;
    private unbindSessionEnd;
}
