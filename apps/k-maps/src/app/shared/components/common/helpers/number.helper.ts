import BigNumber from 'bignumber.js';

export function convertBigNumber(value: number | string, decimals: number): number {
  return Number(new BigNumber(value).toFixed(decimals, 1));
}

export function roundTo(value: number, decimals: number): number {
  const precision = Math.pow(10, decimals);
  return Math.round(value * precision) / precision;
}
