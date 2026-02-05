import { ContractType } from './contract.domain';

export enum ServiceType {
  // Price per VIN
  VIN = 'VIN',
  // Price per Trip
  TRIP = 'TRIP',
  // Price per Vin and Truck (VIN base load)
  VINPERTRUCK = 'VINPERTRUCK',

  LOAD = 'LOAD',
  // VIN base mean
  VINPERMEAN = 'VINPERMEAN',
  MEAN = 'MEAN',
  MQC = 'MQC'
}

export const getContractServiceTypes = (contractType: ContractType) => (contractType === ContractType.TRANSPORT ? 
  [ServiceType.VIN, ServiceType.VINPERTRUCK, ServiceType.LOAD, ServiceType.VINPERMEAN, ServiceType.MEAN, ServiceType.MQC] 
  : [ServiceType.VIN, ServiceType.TRIP]);
