# KEM JS (ML-KEM)

A pure-JavaScript implementation of the **FIPS 203 ML-KEM** (formerly CRYSTALS-Kyber) Key Encapsulation Mechanism.

This library is engineered for maximal V8 execution efficiency and strict standard compliance without allocating expensive TypedArray garbage collection loops, relying strictly on 3D simulated `Int32Array` polynomials. It runs entirely synchronously in pure JavaScript with native Post-Quantum resistance.

## Features
- **FIPS 203 API**: Provides Native `mlKemKeyGen`, `mlKemEncaps`, and `mlKemDecaps` routines mathematically checked against Reference specifications.
- **Mathematical Scaffolding**: Implements high-performance bitwise Barrett and Montgomery reduction protocols bridging Cooley-Tukey and Gentleman-Sande NTT butterflies safely avoiding precision overflows natively.
- **Constant-Time execution**: Fully defends against IND-CCA2 Decapsulation timing side-channels via logical arithmetic bit-mask mappings preventing V8 branch inferences on implicit rejection states.

## stdlib Ecosystem Showcase
This project is built on `@stdlib` the standard library for JavaScript scientific computing. The following packages are integrated:

| Package | Usage |
|---------|-------|
| `@stdlib/ndarray-ctor` | 3D polynomial matrix (`PolyMatrix`) backed by proper ndarray |
| `@stdlib/array-int32` | Typed array allocation for polynomial buffers |
| `@stdlib/math-base-ops-imul` | All modular arithmetic (NTT, Barrett, Montgomery) |
| `@stdlib/math-base-special-floor` | Compression/decompression rounding |
| `@stdlib/assert-is-uint8array` | Input validation on KEM API entry points |

## Installation

```bash
npm install kem-js
```

## Parameter Sets
Supported parameter architectures uniformly match NIST standardization security mappings:
- `ML-KEM-512`
- `ML-KEM-768`
- `ML-KEM-1024`

## Basic Example

```javascript
const crypto = require('crypto');
const { mlKemKeyGen, mlKemEncaps, mlKemDecaps } = require('kem-js');

// 1. Establish Randomness Seeds
const d = crypto.randomBytes(32);
const z = crypto.randomBytes(32); // implicit rejection key

// 2. Key Generation
const { ek, dk } = mlKemKeyGen(d, z, 'ML-KEM-512');

// 3. Encapsulation 
const m = crypto.randomBytes(32);
const { K, c } = mlKemEncaps(ek, m, 'ML-KEM-512');
// K is the 32-byte shared symmetric AES candidate, c is public ciphertext

// 4. Decapsulation
const sessionKey = mlKemDecaps(c, dk, 'ML-KEM-512');

// => K and sessionKey perfectly synchronize
```

## Backend Infrastructure Setup
Cryptographic operations are mathematically exhaustive. To prevent event loop locks on Node.js API backends, we integrate `worker_threads` natively offloading operations via deterministic queues smoothly bridged to Express routes. Reference the `backend` directory mapping a complete `AES-256-GCM` handshake API established from symmetric keys generated within ML-KEM algorithms.

## Execution and Benchmarking
Ensure the full internal math engine adheres properly:
```bash
make test
```
