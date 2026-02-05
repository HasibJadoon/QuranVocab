export enum EmailAttachedDocumentType {
  //proof of collect/delivery
  POC_POD = 'POC_POD',
  CMR = 'CMR',
  //national transport document
  NTD = 'NTD',
  AUTOBID_VAT = 'AUTOBID_VAT'
}

export const EMAIL_ATTACHED_DOCUMENT_TYPE: Array<string> = Object.keys(EmailAttachedDocumentType).map((k) => EmailAttachedDocumentType[k]);
