export enum TransportType {
  TRUCK = 'TRUCK',
  JOCKEY = 'JOCKEY',
  RAIL = 'RAIL',
  SEA = 'SEA'
}

export const TRANSPORT_TYPES = Object.keys(TransportType).map((k) => TransportType[k]);
