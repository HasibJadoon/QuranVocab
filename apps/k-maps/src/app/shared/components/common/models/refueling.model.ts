import { ILocalDate, ITracable } from '@lib-shared/common/models/types.model';

export interface IRefueling extends ITracable {
  _id?: string;
  resource_id: string;
  carrier_id: string;
  refueling_date: ILocalDate;
  gas_station_label: string;
  fuel_quantity: number;
  mileage: number;
  ad_blue: number;
}
