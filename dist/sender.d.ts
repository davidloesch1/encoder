import { TriggerType } from './types';
declare global {
    interface Window {
        FS?: (command: string, payload: Record<string, unknown>) => void;
    }
}
export declare class FingerprintSender {
    private sessionId;
    private eventName;
    constructor(sessionId: string, eventName?: string);
    send(fingerprint: Float32Array, triggerType: TriggerType): void;
}
