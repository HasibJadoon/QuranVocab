export enum TransportRoadType {
  TRUCK = 'TRUCK',
  JOCKEY = 'JOCKEY'
}

export const TRANSPORT_ROAD_TYPES = Object.keys(TransportRoadType).map((k) => TransportRoadType[k]);
