/**
 * Status de la commande de transport route
 */
export enum RoadTransportOrderStatus {
  // Brouillon - La commande est en construction
  DRA = 'DRA',
  // Valider - Le donneur d'ordre valide la commande
  VAL = 'VAL',
  // Confirmé - La commande est associé à un carrier qui a accepté
  COF = 'COF',
  // Planifié - La commande a une date de début et une ressource
  FOR = 'FOR',
  // En cours - La commande a commencé (en route l'enlèvement, enlèvement, route pour la livraison, ou livraison)
  CUR = 'CUR',
  // Exécuté - La commande est terminé, toutes les livraisons ont été faite.
  EXE = 'EXE',
  // Soldé - la commande n'a pas pu etre fait et la commande est terminé
  FAI = 'FAI',
  // Annulé - La commande est annulée
  CAN = 'CAN',
  // Annulé facturable - Le voyage est annulé et facturable
  CAN_IAB = 'CAN_IAB',
  // Annulé non facturable - Le voyage est annulé et non facturable
  CAN_IGN = 'CAN_IGN'
}

export const ROAD_TRANSPORT_ORDER_STATUSS = Object.keys(RoadTransportOrderStatus).map((k) => RoadTransportOrderStatus[k]);

/**
 * Purchase Invoice status
 */
export enum RoadTransportOrderPurchaseInvoiceStatus {
  /**
   * Not Invoicable : La commande de transport n'est pas facturable
   */
  NOI = 'NOI',
  /**
   * Invoicable : La commande de transport est facturable
   */
  IAB = 'IAB',
  /**
   * Ready For Invoice : La commande de transport prêtes a être facturée
   */
  RFI = 'RFI',
  /**
   * Pre-Invoiced: La commande de transport est en préfacturation
   */
  PRI = 'PRI',
  /**
   * Invoice In Progress: La commande de transport est en cours de facturation
   */
  IIP = 'IIP',
  /**
   * Invoiced : La commande de transport est facturée
   */
  IVD = 'IVD',
  /**
   * Ignored: La facturation de la commande de tranport est ignoré
   */
  IGN = 'IGN'
}

/**
 * Transport status
 */
export enum RoadTransportOrderTransportStatus {
  /**
   * Executed
   */
  EXE = 'EXE',
  /**
   * In Progress
   */
  IP = 'IP',
  /**
   * Pickup in progress
   */
  PIP = 'PIP',
  /**
   * On the site of the pickup
   */
  OSP = 'OSP',
  /**
   * On the way to pickup
   */
  OWP = 'OWP'
}

export const RTO_TRANSPORT_STATUS: Array<string> = Object.keys(RoadTransportOrderTransportStatus).map((k) => RoadTransportOrderTransportStatus[k]);
