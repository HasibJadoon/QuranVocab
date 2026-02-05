export enum ServiceType {
  // Prix au vin
  VIN = 'VIN',
  // Prix au voyage
  TRIP = 'TRIP'
}

export const SERVICE_TYPES = Object.keys(ServiceType).map((k) => ServiceType[k]);
