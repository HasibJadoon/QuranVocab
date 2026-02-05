/**
 * Status du voyage : à revoir...
 */
export enum TripStatus {
  // le trip est un brouillon
  DRA = 'DRA',
  // Le trip n'a pas de supplier (carrier) associé
  TMP = 'TMP',
  // Planifié - Le trip a un supplier (carrier)
  FOR = 'FOR',
  // Res: le trip a un carrier et une resource
  RES = 'RES',
  // En cours - Le trip a une date réelle de début
  CUR = 'CUR',
  // Exécuté - Les véhicules du trip ont tous été livrés, donc possèdent une date réelle de livraison
  EXE = 'EXE',
  // Annulé facturable - Le voyage est annulé et facturable
  CAN_IAB = 'CAN_IAB',
  // Annulé non facturable - Le voyage est annulé et non facturable
  CAN_IGN = 'CAN_IGN'
}

export enum TripInvoiceStatus {
  // Not invoicable : Le trip n'est pas facturable
  PNOI = 'PNOI',
  // Invoicable : Le trip est facturable
  PIAB = 'PIAB',
  // Ready for invoice : Le trip est prêt à être facturé
  PRFI = 'PRFI',
  // Pre-invoice : Le trip est prêt à être facturé
  PPRI = 'PPRI',
  // Invoice in progress: Le trip est en cours de facturation
  PIIP = 'PIIP',
  // Invoiced : Le trip est facturé
  PIVD = 'PIVD',
  // Ignored : Le trip est ignoré
  PIGN = 'PIGN'
}

export const TRIP_STATUS = Object.keys(TripStatus).map((k) => TripStatus[k]);
export const TRIP_INVOICE_STATUS = Object.keys(TripInvoiceStatus).map((k) => TripInvoiceStatus[k]);
