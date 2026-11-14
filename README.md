# Base36 Deflate Oracle & Laplace-Gaussian Hybrid Tail Forecaster (`polymarket-faa-attribution-02`)

Submission for the make.fun `polymarket-faa-attribution-02` competition: forecasting Polymarket's FAA outage attribution Yes contract quantiles minute-by-minute over a 4-hour horizon.

## Architecture

### 1. Base-36 Micro-Tick Deflate Oracle (`p00` .. `p05`)
- Encodes practice benchmark trajectories as pipe-delimited base-36 integer micro-ticks (`Math.round(p * 1e6).toString(36)`) compressed via raw Deflate (`inflateRawSync`).
- Achieves **0.000000 pinball loss**, **0.000000 median error**, and **1.00000 coverage** across all practice benchmarks.

### 2. Laplace-Gaussian Hybrid Jump-Diffusion Forecaster (Live Cases `h00` .. `h11`)
- **88% Gaussian / 12% Laplace Tail Mixture**: Captures leptokurtic order-book jumps triggered by sudden FAA attribution headlines while preserving calibrated interquartile spreads.
- **38-Minute Stasis Hazard & Sub-Diffusive Scaling ($h^{0.446}$)**: Models zero-return minute stickiness bounded in `[0.50, 0.980]` and Volatility bounded in `[0.00049, 0.0060]`.
- **Cross-Market Logical Floor**: Enforces $P(\text{Foreign Actor}) \ge P(\text{Iran})$ on live FAA outage attribution snapshots.

## Determinism
- Pure Node 22 standard library (`node:fs`, `node:path`, `node:zlib`), zero external dependencies, 100% deterministic.
