import { QuotationMeansRoadTaxedObject } from './domains/quotation-means-road-type.domain';
import { IMemberRole } from './member-role.model';
import { IPricing } from './pricing.model';
import { IQuotationVehicleOptions } from './quotation-transport-road.model';
import { ICountryCrossed } from './road-transport-order-model';

export interface IQuotationMeansRoadOptions {
  order_date?: string;
  root_pricing?: IPricing;
  type: QuotationMeansRoadTaxedObject;
  tarif_code?: string;
  rto?: {
    loaded_distance?: number;
    empty_distance_before?: number;
    empty_distance_after?: number;
    total_rtos_distance?: number;
    vehicle_data?: IQuotationVehicleOptions[];
    no_vehicle_data?: IQuotationVehicleOptions;
    starting_place?: IMemberRole;
    ending_place?: IMemberRole;
    stop_count?: IStopCount;
    country_crossed?: ICountryCrossed[];
  };
  dfc?: {
    days: number;
    stop_count?: IStopCount;
  };
}

interface IStopCount {
  pickup?: number;
  delivery?: number;
}
