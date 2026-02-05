export enum DistributionType {
  A_PAPER = 'A_PAPER',
  E_EDI = 'E_EDI',
  P_MODE_E_PUSH = 'P_MODE_E_PUSH'
}

export const DISTRIBUTION_TYPES = Object.keys(DistributionType).map((k) => DistributionType[k]);
