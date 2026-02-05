export enum InvoiceableEvent {
  BILLING_AFTER_COMPLETION = 'BILLING_AFTER_COMPLETION',
  BILLING_AFTER_SHIPPING = 'BILLING_AFTER_SHIPPING',
  BILLING_AT_STOCK_ENTRY = 'BILLING_AT_STOCK_ENTRY'
}

export const INVOICEABLE_EVENTS = Object.keys(InvoiceableEvent).map((key) => InvoiceableEvent[key]);
