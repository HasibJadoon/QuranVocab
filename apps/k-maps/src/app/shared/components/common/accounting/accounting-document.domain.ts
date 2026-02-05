// Statut du document
export enum AccountingDocumentStatus {
  DRAFT = 'DRAFT',
  INVOICED = 'INVOICED',
  AUTOINVOICED = 'AUTOINVOICED',
  DRAFT_PENDING = 'DRAFT_PENDING',
  RECORDED = 'RECORDED'
}

// Type de document
export enum AccountingDocumentType {
  INVOICE = 'INVOICE',
  AUTOINVOICE = 'AUTOINVOICE',
  PREINVOICE = 'PREINVOICE',
  SALES_PREINVOICE = 'SALES_PREINVOICE',
  CREDIT_NOTE = 'CREDIT_NOTE',
  PRE_CREDIT_NOTE = 'PRE_CREDIT_NOTE',
  RETRIBUTION = 'RETRIBUTION',
  RETRIBUTION_CREDIT = 'RETRIBUTION_CREDIT',
  SALES_PROVISION = 'SALES_PROVISION',
  SALES_PROVISION_CREDIT = 'SALES_PROVISION_CREDIT',
  PURCHASES_PROVISION = 'PURCHASES_PROVISION',
  PURCHASES_PROVISION_CREDIT = 'PURCHASES_PROVISION_CREDIT'
}

// Découpage des documents
export enum AccountingDocumentGroup {
  NONE = 'NONE',
  MAIN_OBJECT_NAME = 'MAIN_OBJECT_NAME',
  MAIN_OBJECT_X_NAME = 'MAIN_OBJECT_X_NAME',
  END_PRESTATION_ADDRESS = 'END_PRESTATION_ADDRESS',
  SERVICE_TYPE = 'SERVICE_TYPE'
}

export const ACCOUNTING_DOCUMENT_GROUPS = Object.keys(AccountingDocumentGroup).map((k) => AccountingDocumentGroup[k]);

// Modèle de la facture SAP
export enum SAPFormat {
  MODEL1 = 'MODEL1'
}

// Délai de paiement
export enum PaymentTerm {
  '00J' = '00J',
  '05J' = '05J',
  '30J' = '30J',
  '40J' = '40J',
  '45J' = '45J',
  '60J' = '60J',
  '30M' = '30M',
  '60M' = '60M',
  '4J2' = '4J2',
  '6J2' = '6J2',
  '90M' = '90M',
  '602_PT' = '602',
  '302_PT' = '302',
  '_20' = '20',
  '_301' = '301',
  '_305' = '305',
  '_310' = '310',
  '_315' = '315',
  '_320' = '320',
  '_330' = '330',
  '_405' = '405',
  '_410' = '410',
  '_601' = '601',
  '_605' = '605',
  '_607' = '607',
  '_610' = '610',
  '_615' = '615',
  '_620' = '620',
  '_625' = '625',
  '_901' = '901',
  '_905' = '905',
  '_910' = '910',
  '_920' = '920',
  '_925' = '925',
  '_3010' = '3010',
  '_08J' = '08J',
  '_10J' = '10J',
  '_14J' = '14J',
  '_15J' = '15J',
  '_17J' = '17J',
  '_17M' = '17M',
  '_20J' = '20J',
  '_25J' = '25J',
  '_3J5' = '3J5',
  '_45M' = '45M',
  '_6J1' = '6J1',
  '_75J' = '75J',
  '_77J' = '77J',
  '_80J' = '80J',
  '_85J' = '85J',
  '_8J2' = '8J2',
  '_90J' = '90J',
  '_9J2' = '9J2',
  '_3J2' = '3J2',
  '_65J5' = '65J5'
}

export const PAYMENT_TERMS = Object.values(PaymentTerm);

// Méthode de facturation
export enum InvoicingMethod {
  INVOICE = 'INVOICE',
  PREINVOICE = 'PREINVOICE',
  AUTOINVOICE = 'AUTOINVOICE'
}

export const INVOICING_METHODS = Object.values(InvoicingMethod);

// Incoterm
export enum IncotermCode {
  EXW = 'EXW',
  FCA = 'FCA',
  CPT = 'CPT',
  CIP = 'CIP',
  DAP = 'DAP',
  DPU = 'DPU',
  DDP = 'DDP',
  FAS = 'FAS',
  FOB = 'FOB',
  CFR = 'CFR',
  CIF = 'CIF'
}

export const INCOTERM_CODES = Object.values(IncotermCode);

// Header du fichier de Dotax
export enum DotaxHeader {
  EMPTY = 'EMPTY',
  MAIN_OBJECT_X_NAME = 'MAIN_OBJECT_X_NAME',
  VEHICLE_X_VIN = 'VEHICLE_X_VIN',
  PRESTATION_IN_MONTH_YEAR = 'PRESTATION_IN_MONTH_YEAR',
  WEEK_NO = 'WEEK_NO',
  CUSTOMER_CODIFICATIONS = 'CUSTOMER_CODIFICATIONS'
}

export const DOTAX_HEADERS = Object.values(DotaxHeader);

// Découpage des lignes du fichier Dotax
export enum DotaxLineGroup {
  PRICE_ONLY = 'PRICE_ONLY',
  PRICE_ORIGIN_DESTINATION = 'PRICE_ORIGIN_DESTINATION'
}

export const DOTAX_LINE_GROUPS = Object.values(DotaxLineGroup);

// Détail sur le fichier Dotax
export enum DotaxLineDetail {
  NONE = 'NONE',
  ALL = 'ALL'
}

export const DOTAX_LINE_DETAILS = Object.values(DotaxLineDetail);

// Calendrier de facturation par défaut
export const BillingCalendarDefault = 'ENDOFMONTH';

// TEMPORAIRE LE TEMPS DE METTRE TAXATION LINE DOMAIN DANS LIB SHARED
export enum ReadyForInvoiceValidatedType {
  RFIC = 'RFIC',
  RFIS = 'RFIS'
}

export enum FeedbackType {
  SAP = 'SAP',
  DOTAX = 'DOTAX'
}

export enum ExportType {
  LIGHT = 'LIGHT',
  DETAILED = 'DETAILED'
}

export const SALES_BILLING_DOCUMENT_TYPES = [AccountingDocumentType.INVOICE, AccountingDocumentType.CREDIT_NOTE, AccountingDocumentType.RETRIBUTION, AccountingDocumentType.RETRIBUTION_CREDIT];

export const SALES_ACCRUALS_DOCUMENT_TYPES = [AccountingDocumentType.SALES_PROVISION, AccountingDocumentType.SALES_PROVISION_CREDIT];

export const PURCHASE_BILLING_DOCUMENT_TYPES = [AccountingDocumentType.PREINVOICE, AccountingDocumentType.PRE_CREDIT_NOTE, AccountingDocumentType.RETRIBUTION, AccountingDocumentType.RETRIBUTION_CREDIT];

export const PURCHASE_ACCRUALS_DOCUMENT_TYPES = [AccountingDocumentType.PURCHASES_PROVISION, AccountingDocumentType.PURCHASES_PROVISION_CREDIT];

export const CREDIT_NOTE_ERROR_TYPES = ['INVALID_SOURCE_DOCUMENT', 'COMPLETE_CREDIT_NOTE_ALREADY_GENERATED'];
