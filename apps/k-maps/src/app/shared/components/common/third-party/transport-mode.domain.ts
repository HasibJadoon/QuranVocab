export enum TransportMode {
  R = 'R', // ROAD
  S = 'S', // SEA
  T = 'T' // TRAIN
}

export const TRANSPORT_MODES = Object.keys(TransportMode).map((k) => TransportMode[k]);
