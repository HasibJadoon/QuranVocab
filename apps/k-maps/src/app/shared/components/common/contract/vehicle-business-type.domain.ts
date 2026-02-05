export enum VehicleBusinessType {
  VN = 'VN',
  VO = 'VO'
}

export const VEHICLE_BUSINESS_TYPES = Object.keys(VehicleBusinessType).map((k) => VehicleBusinessType[k]);
