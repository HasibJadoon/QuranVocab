export enum TaxedObjectReference {
  X_ORDER_NO = 'X_ORDER_NO'
}

export const TAXED_OBJECT_REFERENCE = Object.keys(TaxedObjectReference).map((k) => TaxedObjectReference[k]);
