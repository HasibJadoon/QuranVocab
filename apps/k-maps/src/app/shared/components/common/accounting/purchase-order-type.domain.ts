export enum PurchaseOrderType {
  MANUAL = 'MANUAL',
  PREINVOICE = 'PREINVOICE',
  CONTRACT = 'CONTRACT'
}

export const PURCHASE_ORDER_TYPES = Object.keys(PurchaseOrderType).map((k) => PurchaseOrderType[k]);
