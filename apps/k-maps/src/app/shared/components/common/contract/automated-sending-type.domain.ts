export enum AutomatedSendingType {
  NONE = 'NONE',
  SENDING_SAP = 'SENDING_SAP',
  NO_SENDING_SAP = 'NO_SENDING_SAP'
}

export const AUTOMATED_SENDING_TYPES = Object.keys(AutomatedSendingType).map((k) => AutomatedSendingType[k]);
