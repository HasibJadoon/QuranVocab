export enum OwnerRole {
  CHARTER = 'CHARTER',
  CARRIER = 'CARRIER',
  COMPOUND = 'COMPOUND',
  FVL = 'FVL',
  ACCOUNTING = 'ACCOUNTING'
}

export const OWNER_ROLES = Object.keys(OwnerRole).map((k) => OwnerRole[k]);

export enum ContractType {
  // Transport
  TRANSPORT = 'TRANSPORT',
  // Transport Route
  TRSP_ROAD = 'TRSP_ROAD',
  // Moyens routiers
  MEANS_ROAD = 'MEANS_ROAD',
  // // Stockage
  // STORAGE = 'STORAGE',
  // // Repair
  // WORKSHOP = 'WORKSHOP',
  // // Transport Fer, Transport Mer, Moyens Fer, ...
  SALES_SCHEME = 'SALES_SCHEME',
  PARK = 'PARK',
  SERVICE = 'SERVICE'
}

export const CONTRACT_TYPES = Object.keys(ContractType).map((k) => ContractType[k]);

export enum ContractRoleRestriction {
  NONE = 'NONE',
  SUPPLIER_CHARTER_ONLY = 'SUPPLIER_CHARTER_ONLY',
  SUPPLIER_CARRIER_ONLY = 'SUPPLIER_CARRIER_ONLY'
}
export const CONTRACT_ROLES_RESTRICTIONS = Object.keys(ContractRoleRestriction).map((k) => ContractRoleRestriction[k]);

export enum RestrictionPurchaseSales {
  NONE = 'NONE',
  PURCHASE = 'PURCHASE',
  SALES = 'SALES'
}
export const RESTRICTION_PURCHASE_SALES = Object.values(RestrictionPurchaseSales);

export enum ContractMirrorType {
  PURCHASE = 'PURCHASE',
  SALES = 'SALES'
}