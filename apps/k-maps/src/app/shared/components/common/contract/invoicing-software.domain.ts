export enum InvoicingSoftware {
  MOVEECAR = 'Moveecar',
  ROMA = 'ROMA',
  OTHER = 'Other'
}

export const INVOICING_SOFTWARE = Object.keys(InvoicingSoftware).map((k) => InvoicingSoftware[k]);
