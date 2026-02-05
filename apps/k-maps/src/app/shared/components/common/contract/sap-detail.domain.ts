export enum InvoiceDisplaySap {
  '01' = '01',
  '02' = '02',
  '03' = '03',
  '04' = '04',
  I1 = 'I1',
  I2 = 'I2',
  X1 = 'X1',
  X2 = 'X2'
}

export const INVOICE_DISPLAY_SAPS = Object.keys(InvoiceDisplaySap).map((k) => InvoiceDisplaySap[k]);

export enum InvoiceLineDetailSap {
  NONE = 'NONE',
  ALL = 'ALL',
  ALL2 = 'ALL2'
}

export const INVOICE_LINE_DETAIL_SAPS = Object.keys(InvoiceLineDetailSap).map((k) => InvoiceLineDetailSap[k]);

export enum PreinvoiceDisplaySap {
  'NONE' = 'NONE',
  '01' = '01'
}

export const PREINVOICE_DISPLAY_SAPS = Object.keys(PreinvoiceDisplaySap).map((k) => PreinvoiceDisplaySap[k]);
