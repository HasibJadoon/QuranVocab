/**
 * Status de la commande de transport : à revoir...
 */
export enum TransportOrderStatus {
  // Brouillon - La commande est en construction
  DRA = 'DRA',
  // La commande de transport est validée par le donneur d'ordre
  VAL = 'VAL',
  // Confirmé - La commande est associée à un charter qui a accepté
  COF = 'COF',
  // La commande de transport possède au moins un véhicule qui est associé à un trip possédant une date réelle de début OU la commande de transport est une commande de moyen rattachée à un trip possédant une date réelle de début
  CUR = 'CUR',
  // Exécuté - L'ensemble des objets de la commande est terminé, toutes les livraisons ont été faites
  EXE = 'EXE',
  // Canceled-Ignored - La commande est annulé mais non facturable
  CAN_IGN = 'CAN_IGN',
  // Canceled-Invoiceable - La commande est annulé mais facturable
  CAN_IAB = 'CAN_IAB'
}

export enum TransportOrderInvoiceStatus {
  // NOt Invoicable : La commande de transport n'est pas facturable
  NOI = 'NOI',
  // InvoicABle : La commande de transport est facturable
  IAB = 'IAB',
  // Ready For Invoice : La commande de transport prêtes a être facturée
  RFI = 'RFI',
  // Invoice In Progress: La commande de transport est en cours de facturation
  IIP = 'IIP',
  // InVoiceD : La commande de transport est facturée
  IVD = 'IVD',
  // Invoice CAncelled: La facturation de la commande de tranport est annulée et n'aura jamais lieu
  ICA = 'ICA'
}

export const TRANSPORT_ORDER_STATUS = Object.keys(TransportOrderStatus).map((k) => TransportOrderStatus[k]);
export const TRANSPORT_ORDER_INVOICE_STATUS = Object.keys(TransportOrderInvoiceStatus).map((k) => TransportOrderInvoiceStatus[k]);
