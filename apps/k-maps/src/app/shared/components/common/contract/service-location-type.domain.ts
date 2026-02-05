export enum ServiceLocationType {
  ORIGIN = 'ORIGIN',
  DESTINATION = 'DESTINATION',
  VIA1 = 'VIA1',
  VIA2 = 'VIA2',
  FORCED = 'FORCED'
}

export const SERVICE_LOCATION_TYPE = Object.keys(ServiceLocationType).map((k) => ServiceLocationType[k]);
