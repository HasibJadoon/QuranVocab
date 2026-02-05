export enum LockingType {
  // Blocage total
  TOTAL = 'TOTAL',
  DELIVERY_ONLY = 'DELIVERY_ONLY'
}
export const LOCKING_TYPES: Array<string> = Object.keys(LockingType).map((k) => LockingType[k]);
