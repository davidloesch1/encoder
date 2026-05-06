import { TriggerType } from './types';
declare global {
    interface Window {
        FS?: (command: string, payload: Record<string, unknown>) => void;
    }
}
export type Destination = {
    type: 'fullstory';
    eventName: string;
} | {
    type: 'http';
    endpoint: string;
    headers: Record<string, string>;
};
export declare function parseDestination(raw: string, eventName: string, headers: Record<string, string>): Destination;
export declare class FingerprintSender {
    private sessionId;
    private destination;
    constructor(sessionId: string, destination: Destination);
    send(fingerprint: Float32Array, triggerType: TriggerType): void;
    private sendToFullStory;
    private sendToHttp;
    private postFetch;
}
