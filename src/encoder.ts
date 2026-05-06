import * as tf from '@tensorflow/tfjs';
import { INPUT_DIM, HIDDEN_DIM } from './types';

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
export class GRUEncoder {
  private hiddenState: tf.Tensor2D;
  private kernelZ!: tf.Tensor2D;
  private recurrentKernelZ!: tf.Tensor2D;
  private biasZ!: tf.Tensor1D;
  private kernelR!: tf.Tensor2D;
  private recurrentKernelR!: tf.Tensor2D;
  private biasR!: tf.Tensor1D;
  private kernelH!: tf.Tensor2D;
  private recurrentKernelH!: tf.Tensor2D;
  private biasH!: tf.Tensor1D;
  private initialized = false;

  constructor() {
    this.hiddenState = tf.zeros([1, HIDDEN_DIM]) as tf.Tensor2D;
  }

  async initialize(weights?: ArrayBuffer): Promise<void> {
    if (this.initialized) return;

    if (weights) {
      this.loadWeightsFromBuffer(weights);
    } else {
      this.initializeWithSeed();
    }
    this.initialized = true;
  }

  private loadWeightsFromBuffer(buffer: ArrayBuffer): void {
    const floats = new Float32Array(buffer);
    let offset = 0;

    const read = (shape: number[]): Float32Array => {
      const size = shape.reduce((a, b) => a * b, 1);
      const slice = floats.slice(offset, offset + size);
      offset += size;
      return slice;
    };

    this.kernelZ = tf.tensor2d(read([INPUT_DIM, HIDDEN_DIM]), [INPUT_DIM, HIDDEN_DIM]);
    this.recurrentKernelZ = tf.tensor2d(read([HIDDEN_DIM, HIDDEN_DIM]), [HIDDEN_DIM, HIDDEN_DIM]);
    this.biasZ = tf.tensor1d(read([HIDDEN_DIM]));

    this.kernelR = tf.tensor2d(read([INPUT_DIM, HIDDEN_DIM]), [INPUT_DIM, HIDDEN_DIM]);
    this.recurrentKernelR = tf.tensor2d(read([HIDDEN_DIM, HIDDEN_DIM]), [HIDDEN_DIM, HIDDEN_DIM]);
    this.biasR = tf.tensor1d(read([HIDDEN_DIM]));

    this.kernelH = tf.tensor2d(read([INPUT_DIM, HIDDEN_DIM]), [INPUT_DIM, HIDDEN_DIM]);
    this.recurrentKernelH = tf.tensor2d(read([HIDDEN_DIM, HIDDEN_DIM]), [HIDDEN_DIM, HIDDEN_DIM]);
    this.biasH = tf.tensor1d(read([HIDDEN_DIM]));
  }

  /**
   * Deterministic Xavier/Glorot initialization using a seeded PRNG.
   * Produces identical weights every time regardless of platform.
   */
  private initializeWithSeed(): void {
    const seed = 42;
    const rng = seededRandom(seed);

    const xavier = (fanIn: number, fanOut: number, size: number): Float32Array => {
      const limit = Math.sqrt(6 / (fanIn + fanOut));
      const data = new Float32Array(size);
      for (let i = 0; i < size; i++) {
        data[i] = (rng() * 2 - 1) * limit;
      }
      return data;
    };

    const zeros = (size: number) => new Float32Array(size);

    this.kernelZ = tf.tensor2d(xavier(INPUT_DIM, HIDDEN_DIM, INPUT_DIM * HIDDEN_DIM), [INPUT_DIM, HIDDEN_DIM]);
    this.recurrentKernelZ = tf.tensor2d(xavier(HIDDEN_DIM, HIDDEN_DIM, HIDDEN_DIM * HIDDEN_DIM), [HIDDEN_DIM, HIDDEN_DIM]);
    this.biasZ = tf.tensor1d(zeros(HIDDEN_DIM));

    this.kernelR = tf.tensor2d(xavier(INPUT_DIM, HIDDEN_DIM, INPUT_DIM * HIDDEN_DIM), [INPUT_DIM, HIDDEN_DIM]);
    this.recurrentKernelR = tf.tensor2d(xavier(HIDDEN_DIM, HIDDEN_DIM, HIDDEN_DIM * HIDDEN_DIM), [HIDDEN_DIM, HIDDEN_DIM]);
    this.biasR = tf.tensor1d(zeros(HIDDEN_DIM));

    this.kernelH = tf.tensor2d(xavier(INPUT_DIM, HIDDEN_DIM, INPUT_DIM * HIDDEN_DIM), [INPUT_DIM, HIDDEN_DIM]);
    this.recurrentKernelH = tf.tensor2d(xavier(HIDDEN_DIM, HIDDEN_DIM, HIDDEN_DIM * HIDDEN_DIM), [HIDDEN_DIM, HIDDEN_DIM]);
    this.biasH = tf.tensor1d(zeros(HIDDEN_DIM));
  }

  step(input: Float32Array): void {
    if (!this.initialized) {
      throw new Error('Encoder not initialized. Call initialize() first.');
    }

    tf.tidy(() => {
      const x = tf.tensor2d(input, [1, INPUT_DIM]);
      const hPrev = this.hiddenState;

      // Update gate: z = sigmoid(x*Wz + h*Uz + bz)
      const z = tf.sigmoid(
        tf.add(
          tf.add(tf.matMul(x, this.kernelZ), tf.matMul(hPrev, this.recurrentKernelZ)),
          this.biasZ,
        ),
      ) as tf.Tensor2D;

      // Reset gate: r = sigmoid(x*Wr + h*Ur + br)
      const r = tf.sigmoid(
        tf.add(
          tf.add(tf.matMul(x, this.kernelR), tf.matMul(hPrev, this.recurrentKernelR)),
          this.biasR,
        ),
      ) as tf.Tensor2D;

      // Candidate: h_hat = tanh(x*Wh + (r⊙h)*Uh + bh)
      const hCandidate = tf.tanh(
        tf.add(
          tf.add(tf.matMul(x, this.kernelH), tf.matMul(tf.mul(r, hPrev) as tf.Tensor2D, this.recurrentKernelH)),
          this.biasH,
        ),
      ) as tf.Tensor2D;

      // New state: h = (1-z)⊙h_prev + z⊙h_candidate
      const oneMinusZ = tf.sub(tf.ones(z.shape), z) as tf.Tensor2D;
      const newState = tf.add(
        tf.mul(oneMinusZ, hPrev),
        tf.mul(z, hCandidate),
      ) as tf.Tensor2D;

      const oldState = this.hiddenState;
      this.hiddenState = tf.keep(newState);
      oldState.dispose();
    });
  }

  getFingerprint(): Float32Array {
    return this.hiddenState.dataSync() as Float32Array;
  }

  reset(): void {
    const oldState = this.hiddenState;
    this.hiddenState = tf.zeros([1, HIDDEN_DIM]) as tf.Tensor2D;
    oldState.dispose();
  }

  dispose(): void {
    this.hiddenState.dispose();
    if (this.initialized) {
      this.kernelZ.dispose();
      this.recurrentKernelZ.dispose();
      this.biasZ.dispose();
      this.kernelR.dispose();
      this.recurrentKernelR.dispose();
      this.biasR.dispose();
      this.kernelH.dispose();
      this.recurrentKernelH.dispose();
      this.biasH.dispose();
    }
  }

  exportWeights(): ArrayBuffer {
    const tensors = [
      this.kernelZ, this.recurrentKernelZ, this.biasZ,
      this.kernelR, this.recurrentKernelR, this.biasR,
      this.kernelH, this.recurrentKernelH, this.biasH,
    ];
    const totalSize = tensors.reduce((sum, t) => sum + t.size, 0);
    const buffer = new Float32Array(totalSize);
    let offset = 0;
    for (const t of tensors) {
      const data = t.dataSync();
      buffer.set(data, offset);
      offset += data.length;
    }
    return buffer.buffer;
  }
}

/**
 * Mulberry32 seeded PRNG - produces deterministic values in [0, 1).
 */
function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
