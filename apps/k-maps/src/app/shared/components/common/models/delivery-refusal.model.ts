import { ILocalDate } from './types.model';

export interface IDeliveryRefusal {
  refusal_reason: DeliveryRefusalReason;
  refusal_responsability: RefusalResponsibility;
  refusal_date: ILocalDate;
}

export enum DeliveryRefusalReason {
  DAMAGE_INT = 'DAMAGE',
  DELAY_INT = 'DELAY',
  FULL_CUS = 'FULL',
  ABSENT_CUS = 'ABSENT',
  WRONG_ADDRESS_INT = 'WRONG_ADDRESS_INT',
  WRONG_ADDRESS_CUS = 'WRONG_ADDRESS_CUS',
  WRONG_VEHICLE_INT = 'WRONG_VEHICLE'
}

export enum RefusalResponsibility {
  INTERNAL = 'INTERNAL',
  CUSTOMER = 'CUSTOMER'
}
