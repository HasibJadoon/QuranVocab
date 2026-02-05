export enum RequestOrigin {
  driver = 'MOVEECAR_DRIVER',
  driverExternal = 'MOVEECAR_DRIVER_EXTERNAL',
  carrier = 'MOVEECAR_CARRIER',
  charter = 'MOVEECAR_CHARTER',
  supervision = 'MOVEECAR_SUPERVISION',
  customer = 'MOVEECAR_CUSTOMER',
  compound = 'MOVEECAR_COMPOUND',
  accounting = 'MOVEECAR_ACCOUNTING',
  driverCompound = 'MOVEECAR_DRIVER_COMPOUND',
  driverCompoundExternal = 'MOVEECAR_DRIVER_COMPOUND_EXTERNAL',
  fvl = 'MOVEECAR_FVL',
  EAI = 'EAI',
  external = 'EXTERNAL',
  accountingService = 'ACCOUNTING',
  authService = 'AUTH',
  carrierService = 'CARRIER',
  charterService = 'CHARTER',
  compoundService = 'COMPOUND',
  mmglueService = 'MM_GLUE',
  orderService = 'ORDER',
  referentialService = 'REFERENTIAL',
  taxationService = 'TAXATION',
  unknow = 'UNKNOW'
}

export const RequestOrigins: Array<string> = Object.keys(RequestOrigin).map((k) => RequestOrigin[k]);
