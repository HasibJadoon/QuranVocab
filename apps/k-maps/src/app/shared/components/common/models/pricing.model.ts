import { IDerogatory } from './derogatory.model';
import { PricingFormula } from '../contract/pricing-formula.domain';
import { ServicesFormula } from '../contract/services-formula.domain';
import { IService } from './service.model';
import { ITimeLimit } from '../contract/contract.model';
import { ContractType } from '../contract/contract.domain';
import { ServiceType } from './domains/service-type.domain';
import { InvoiceableEvent } from '../contract/invoiceable-event.domain';
import { StartEvent } from '../contract/start-event.domain';

// Manual Service interface for transport contracts
export interface IManualService {
  _id?: string;
  code: string;
  name: {
    default: string;
  };
  price: number;
  mandatory: boolean;
  execution_condition: 'MANDATORY' | 'OPTIONAL';
  run_up: 'IMPLICIT' | 'EXPLICIT';
  derogatory: {
    billed_customer: {
      exclude: boolean;
    };
    supplier: {
      exclude: boolean;
    };
  };
}

export interface IPricings {
  root: IPricing;
  vehicles?: IPricing[];
}

export interface IPricing {
  /* PRIX */

  // transport price
  calculated_price?: number;
  // bunker prices (included in transport price)
  included_bunker_price?: number;
  price_empty_distance_after?: number;
  price_empty_distance_before?: number;
  bunker_price_empty_distance_after?: IBunkerCalculated;
  bunker_price_empty_distance_before?: IBunkerCalculated;
  // Calculated bunker by referential
  calculated_bunker?: IBunkerCalculated;
  total_bunker?: IBunkerTotalCalculation;
  // delta price
  delta_price?: number;
  // price of services
  services_price?: number;
  // total price
  total_price?: number;
  // contract formula that was selected when calculating the price
  formula?: PricingFormula | ServicesFormula;

  // contract information
  contract?: IPricingContractInfo;

  /* additional information */

  // services
  services?: IService[];
  // manual services added to the transport contract
  manual_services?: IManualService[];
  // derogatory information
  derogatory?: IDerogatory;
  //  delay
  time_limit?: ITimeLimit;
  // travel distance information
  tarif_detail?: string;
  // bunker information ??
  // baf_info: IBafInfo;
  service_type?: string;
  // start of delay counting
  start_event?: StartEvent;
  // calculation details for MRE taxation
  rto_calculation_details?: IMreCalculationDetails;
  // pricing code used for MRE taxation (RTO or DFC)
  tarif_code?: string;
  // pricing details (formula, daily price, km price)
  tarif_details?: ITarifDetails;

  // country crossed
  country_crossed?: ICountryCrossed[];
  
  mean_total_price?: number;
  baf_price?: number;
  mean_adding_volume?: number;
}

export interface IMreCalculationDetails {
  // total distance of the RTOs group for the Padroncini option
  total_rtos_distance?: number;
  // distance considered to calculate the price
  distance?: number;
  // distance considered to calculate the price
  empty_after?: number;
  // distance considered to calculate the price
  empty_before?: number;
  // price per km
  price_per_km?: number | null;
  // km distance (using the DISTANCE formula)
  threshold?: number | null;
  // base price (using the DISTANCE formula)
  base_price?: number | null;
  // minimum price (for the DISTANCE formula)
  min_price?: number;
}

export interface IPricingContractInfo {
  // contract id
  _id?: string;
  // contract code
  code?: string;
  // contract name
  name?: string;
  // type of contract
  type?: ContractType;
  // contract activity code
  activity_code?: string;
  // contract article code
  article_code?: string;
  // contract currency
  currency?: string;
  // type of contract service
  service_type?: ServiceType;
  // Invoiceable event
  invoiceable_event?: InvoiceableEvent;
}

export interface IBunkerCalculated {
  result_code?: string;
  result_text?: string;
  bunker_price?: number;
  bunker_code?: string;
  monthly_index_value?: number;
}

export interface IBunkerTotalCalculation {
  bunker_price: number;
  bunkers: IBunkerCalculated[];
}

export interface ITarifDetails {
  formula?: PricingFormula;
  day_price?: number | null;
  distance_price?: number;
  empty_distance_retribution?: string;
  split?: boolean;
}

// country crossed
export interface ICountryCrossed {
  country_code: string;
  total_price: number;
  included_bunker_price?: number;
  calculated_price: number;
  price_empty_distance_before: number;
  rto_calculation_details: IMreCalculationDetails;
  tarif_detail: string;
  tarif_details: ITarifDetails;
  calculated_bunker: IBunkerCalculated;
  bunker_price_empty_distance_before?: IBunkerCalculated;
  bunker_price_empty_distance_after?: IBunkerCalculated;
  total_bunker: IBunkerTotalCalculation;
}
