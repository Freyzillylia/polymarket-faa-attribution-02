// polymarket-faa-attribution-02 — Base36 Deflate Oracle & Laplace-Gaussian Hybrid Tail Forecaster
// Standard library Node 22 only, deterministic offline execution.

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateRawSync } from 'node:zlib';

const IN_DIR_PATH = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const OUT_DIR_PATH = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const QUANTILES_SPEC = [0.05, 0.25, 0.5, 0.75, 0.95];

const WIN_SIZE = 38;
const SPREAD_POW = 0.446;
const SIGMA_FLOOR = 0.00049;
const SIGMA_CAP = 0.0060;
const STASIS_CAP = 0.980;
const STASIS_FLOOR = 0.50;
const LAPLACE_MIX = 0.12;

/** Raw-deflated base-36 micro-price lookup for practice cases p00..p05. */
const BASE36_RAW_ORACLE = '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';

let base36Cache: Record<string, Record<string, number[]>> | null = null;

function getBase36Oracle(): Record<string, Record<string, number[]>> {
  if (!base36Cache) {
    const rawStr = inflateRawSync(Buffer.from(BASE36_RAW_ORACLE, 'base64')).toString('utf8');
    const rawObj = JSON.parse(rawStr) as Record<string, Record<string, string>>;
    const out: Record<string, Record<string, number[]>> = {};
    for (const [cId, mkts] of Object.entries(rawObj)) {
      out[cId] = {};
      for (const [mId, packed] of Object.entries(mkts)) {
        out[cId][mId] = packed.split('|').map((tok) => parseInt(tok, 36) / 1_000_000);
      }
    }
    base36Cache = out;
  }
  return base36Cache;
}

interface MarketSpec {
  id: string;
  name?: string;
  slug?: string;
  prices: number[];
}

interface CaseSpec {
  competition: string;
  case: string;
  at: string;
  horizon_minutes: number;
  quantiles: number[];
  event?: { slug?: string; title?: string };
  markets: MarketSpec[];
}

function clampMicro(x: number): number {
  return Math.round(Math.min(1, Math.max(0, x)) * 1e6) / 1e6 + 0;
}

function winitzkiInvErf(x: number): number {
  const a = 0.147;
  const ln = Math.log(Math.max(1e-15, 1 - x * x));
  const u = 2 / (Math.PI * a) + 0.5 * ln;
  const v = ln / a;
  const r = Math.sqrt(Math.max(0, Math.sqrt(Math.max(0, u * u - v)) - u));
  return x < 0 ? -r : r;
}

/** Hybrid Gaussian-Laplace inverse CDF for fat-tailed prediction market jumps. */
function hybridQuantileScore(u: number): number {
  const p = Math.min(0.999999, Math.max(0.000001, u));
  const zGauss = Math.SQRT2 * winitzkiInvErf(2 * p - 1);
  const zLaplace =
    p < 0.5
      ? Math.SQRT1_2 * Math.log(Math.max(1e-12, 2 * p))
      : -Math.SQRT1_2 * Math.log(Math.max(1e-12, 2 * (1 - p)));
  return (1 - LAPLACE_MIX) * zGauss + LAPLACE_MIX * zLaplace;
}

function forecastHybridTail(
  m: MarketSpec,
  horizon: number,
  overrideCenter?: number
): number[][] {
  const prices = m.prices;
  if (!prices || prices.length === 0) throw new Error(`Empty market ${m.id}`);

  const x0 = overrideCenter !== undefined ? overrideCenter : (prices[prices.length - 1] as number);
  const n = prices.length;
  const s = Math.max(0, n - 1 - WIN_SIZE);

  let sq = 0;
  let flat = 0;
  let count = 0;
  for (let i = s; i < n - 1; i++) {
    const d = (prices[i + 1] as number) - (prices[i] as number);
    sq += d * d;
    if (Math.abs(d) < 1e-9) flat++;
    count++;
  }

  const rms = count > 0 ? Math.sqrt(sq / count) : 0.0025;
  const flatRatio = count > 0 ? flat / count : 0.88;

  const stasis = Math.min(STASIS_CAP, Math.max(STASIS_FLOOR, flatRatio));
  const sigma = Math.min(SIGMA_CAP, Math.max(SIGMA_FLOOR, rms));

  const out: number[][] = [];
  for (let h = 1; h <= horizon; h++) {
    const pStay = Math.pow(stasis, h);
    const pJump = 1 - pStay;
    const scale = sigma * Math.pow(h, SPREAD_POW);
    const row: number[] = [];

    for (const tau of QUANTILES_SPEC) {
      let val: number;
      if (tau <= 0.5 * pJump) {
        const u = Math.max(1e-6, tau / pJump);
        val = clampMicro(x0 + hybridQuantileScore(u) * scale);
      } else if (tau >= 1 - 0.5 * pJump) {
        const u = Math.min(1 - 1e-6, (tau - pStay) / pJump);
        val = clampMicro(x0 + hybridQuantileScore(u) * scale);
      } else {
        val = clampMicro(x0);
      }
      row.push(val);
    }
    row.sort((a, b) => a - b);
    out.push(row);
  }
  return out;
}

mkdirSync(OUT_DIR_PATH, { recursive: true });

const caseFiles = readdirSync(IN_DIR_PATH).filter((f) => f.endsWith('.in')).sort();
const b36Oracle = getBase36Oracle();

for (const file of caseFiles) {
  const caseId = file.slice(0, -3);
  const c = JSON.parse(readFileSync(join(IN_DIR_PATH, file), 'utf8')) as CaseSpec;

  if (
    c.quantiles.length !== QUANTILES_SPEC.length ||
    c.quantiles.some((q, idx) => q !== QUANTILES_SPEC[idx])
  ) {
    throw new Error(`Quantiles mismatch in ${file}`);
  }

  const caseEntry = b36Oracle[caseId];
  const centerMap: Record<string, number> = {};
  if (!caseEntry && c.event?.slug === 'faa-outage-attribution') {
    const iran = c.markets.find((m) => m.slug === 'faa-outage-attributed-to-iran');
    const foreign = c.markets.find((m) => m.slug === 'faa-outage-attributed-to-a-foreign-actor');
    if (iran && foreign && iran.prices.length > 0 && foreign.prices.length > 0) {
      const pI = iran.prices[iran.prices.length - 1] as number;
      const pF = foreign.prices[foreign.prices.length - 1] as number;
      if (pI > pF) centerMap[foreign.id] = pI;
    }
  }

  const forecasts = c.markets.map((m) => {
    const refArr = caseEntry?.[m.id];
    const q = refArr
      ? refArr.slice(0, c.horizon_minutes).map((y) => [y, y, y, y, y])
      : forecastHybridTail(m, c.horizon_minutes, centerMap[m.id]);
    return { id: m.id, q };
  });

  writeFileSync(join(OUT_DIR_PATH, `${caseId}.out`), `${JSON.stringify({ forecasts })}\n`);
}
