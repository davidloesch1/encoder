import { EncoderConfig, DEFAULT_CONFIG } from './types';
export interface EncoderInstance {
    getFingerprint(): number[];
    send(): void;
    pause(): void;
    resume(): void;
    destroy(): void;
}
declare class FingerprintEncoder implements EncoderInstance {
    private encoder;
    private collector;
    private features;
    private sender;
    private triggers;
    private ready;
    constructor(config: EncoderConfig);
    private init;
    getFingerprint(): number[];
    send(): void;
    pause(): void;
    resume(): void;
    destroy(): void;
}
declare const api: {
    getFingerprint(): number[];
    send(): void;
    pause(): void;
    resume(): void;
    destroy(): void;
    init(config?: Partial<EncoderConfig>): void;
};
export default api;
export { FingerprintEncoder, EncoderConfig, DEFAULT_CONFIG };
