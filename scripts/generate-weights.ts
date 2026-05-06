/**
 * Generates deterministic GRU weights using a seeded PRNG (Mulberry32).
 * Outputs a binary file containing all weight matrices in a flat Float32Array.
 *
 * Weight layout (all Float32, contiguous):
 *   kernelZ:           INPUT_DIM * HIDDEN_DIM
 *   recurrentKernelZ:  HIDDEN_DIM * HIDDEN_DIM
 *   biasZ:             HIDDEN_DIM
 *   kernelR:           INPUT_DIM * HIDDEN_DIM
 *   recurrentKernelR:  HIDDEN_DIM * HIDDEN_DIM
 *   biasR:             HIDDEN_DIM
 *   kernelH:           INPUT_DIM * HIDDEN_DIM
 *   recurrentKernelH:  HIDDEN_DIM * HIDDEN_DIM
 *   biasH:             HIDDEN_DIM
 */

import * as fs from 'fs';
import * as path from 'path';

const INPUT_DIM = 16;
const HIDDEN_DIM = 32;
const SEED = 42;

function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function xavier(rng: () => number, fanIn: number, fanOut: number, size: number): Float32Array {
  const limit = Math.sqrt(6 / (fanIn + fanOut));
  const data = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    data[i] = (rng() * 2 - 1) * limit;
  }
  return data;
}

function generateWeights(): Buffer {
  const rng = seededRandom(SEED);

  const parts: Float32Array[] = [
    // Gate Z
    xavier(rng, INPUT_DIM, HIDDEN_DIM, INPUT_DIM * HIDDEN_DIM),
    xavier(rng, HIDDEN_DIM, HIDDEN_DIM, HIDDEN_DIM * HIDDEN_DIM),
    new Float32Array(HIDDEN_DIM), // bias zeros
    // Gate R
    xavier(rng, INPUT_DIM, HIDDEN_DIM, INPUT_DIM * HIDDEN_DIM),
    xavier(rng, HIDDEN_DIM, HIDDEN_DIM, HIDDEN_DIM * HIDDEN_DIM),
    new Float32Array(HIDDEN_DIM), // bias zeros
    // Candidate H
    xavier(rng, INPUT_DIM, HIDDEN_DIM, INPUT_DIM * HIDDEN_DIM),
    xavier(rng, HIDDEN_DIM, HIDDEN_DIM, HIDDEN_DIM * HIDDEN_DIM),
    new Float32Array(HIDDEN_DIM), // bias zeros
  ];

  const totalSize = parts.reduce((sum, p) => sum + p.length, 0);
  const combined = new Float32Array(totalSize);
  let offset = 0;
  for (const part of parts) {
    combined.set(part, offset);
    offset += part.length;
  }

  return Buffer.from(combined.buffer);
}

const outputDir = path.resolve(__dirname, '..', 'weights');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const weightsBuffer = generateWeights();
const outputPath = path.join(outputDir, 'weights.bin');
fs.writeFileSync(outputPath, weightsBuffer);

const totalFloats = weightsBuffer.length / 4;
console.log(`Generated weights: ${outputPath}`);
console.log(`Total parameters: ${totalFloats} (${weightsBuffer.length} bytes)`);
console.log(`Seed: ${SEED}`);
