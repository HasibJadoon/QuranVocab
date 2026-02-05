import { ServiceType } from './domains/service-type.domain';
import { IMemberRole } from './member-role.model';
import { IPricing } from './pricing.model';
import { IQuotationMeansRoadOptions } from './quotation-means-road.model';
import { IPath } from './trip.model';

export enum PricingFrom {
  TRANSPORT_ORDER = 'TRANSPORT_ORDER',
  TRIP = 'TRIP',
  RTO = 'RTO',
  DFC = 'DFC',
  UNCREATED_VEHICLES = 'UNCREATED_VEHICLES'
}

export interface IQuotationOptions {
  pricing_from?: PricingFrom;
  no_vehicle_data?: IQuotationVehicleOptions;
  vehicle_data?: IQuotationVehicleOptions[];
  mre_data?: IQuotationMeansRoadOptions;
  path?: IPath;
}

export interface IQuotationVehicleOptions {
  order_date: string;
  end_date?: string;
  rolling_vehicle?: boolean;
  maker_code?: string;
  model_code?: string;
  shape_code?: string;
  category_code?: string;
  pickup?: IMemberRole;
  delivery?: IMemberRole;
  price?: number;
  distance?: number;
  principal_id?: string;
  product_code?: string;
  supplier_id?: string;
  customer_id?: string;
  owner_id?: string;
  additional_info?: {
    pickup?: {
      administrative_area_level_1?: string;
      administrative_area_level_2?: string;
      administrative_area_level_3?: string;
    };
    delivery?: {
      administrative_area_level_1?: string;
      administrative_area_level_2?: string;
      administrative_area_level_3?: string;
    };
  };
  root_pricing?: IPricing;
  veh_pricing?: IPricing;
  to_pricing_infos?: IToPricingInfos;
}

export interface IToPricingInfos {
  // to_contract_id: string;
  to_no: string;
  to_vehs_length: number;
  to_service_type: ServiceType;
  to_services_price: number;
  to_sales_pricing: IPricing;
  veh_sales_pricing?: IPricing;
}
