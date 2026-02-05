/**
 * Type de PV / POD
 */
export enum Pod {
  RES = 'RES',
  LIV = 'LIV'
}

export const POD_TYPE = Object.keys(Pod).map((k) => Pod[k]);
