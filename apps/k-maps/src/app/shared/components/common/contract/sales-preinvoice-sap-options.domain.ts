export enum SalesPreinvoiceSendingType {
  NONE = 'NONE',
  SENDING_SAP = 'SENDING_SAP',
  NO_SENDING_SAP = 'NO_SENDING_SAP'
}

export const SALES_PREINVOICE_SENDING_TYPES = Object.keys(SalesPreinvoiceSendingType).map((k) => SalesPreinvoiceSendingType[k]);
