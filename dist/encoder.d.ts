/**
 * GRU-based encoder that maintains a 32-dimensional hidden state.
 * Each call to `step()` processes one feature vector and updates the state.
 * The hidden state IS the fingerprint.
 *
 * GRU equations (single step):
 *   z = sigmoid(Wz * x + Uz * h_prev + bz)   -- update gate
 *   r = sigmoid(Wr * x + Ur * h_prev + br)   -- reset gate
 *   h_candidate = tanh(Wh * x + Uh * (r ⊙ h_prev) + bh)
 *   h_new = (1 - z) ⊙ h_prev + z ⊙ h_candidate
 */
export declare class GRUEncoder {
    private hiddenState;
    private kernelZ;
    private recurrentKernelZ;
    private biasZ;
    private kernelR;
    private recurrentKernelR;
    private biasR;
    private kernelH;
    private recurrentKernelH;
    private biasH;
    private initialized;
    constructor();
    initialize(weights?: ArrayBuffer): Promise<void>;
    private loadWeightsFromBuffer;
    /**
     * Deterministic Xavier/Glorot initialization using a seeded PRNG.
     * Produces identical weights every time regardless of platform.
     */
    private initializeWithSeed;
    step(input: Float32Array): void;
    getFingerprint(): Float32Array;
    reset(): void;
    dispose(): void;
    exportWeights(): ArrayBuffer;
}
