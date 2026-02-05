export enum VehicleServiceBusiness {
  PV = 'PV',
  MC = 'MC',
  PO = 'PO',
  VN = 'VN'
}

export const VEHICLE_SERVICE_BUSINESS: Array<string> = Object.keys(VehicleServiceBusiness).map((k) => VehicleServiceBusiness[k]);
