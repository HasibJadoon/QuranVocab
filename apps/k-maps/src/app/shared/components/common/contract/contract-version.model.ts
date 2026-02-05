import { IService } from '../models/service.model';
import { ITracable } from '../models/types.model';
import { ContractType } from './contract.domain';
import { IGrid, IPricingCriterion, ISalesSchemeContractOutput, ITimeLimit } from './contract.model';
import { ContractFormula } from './contracts-formula.domain';
import { ServicesFormula, ServicesFormulaOrder } from './services-formula.domain';
import { StartEvent } from './start-event.domain';

export interface IContractVersion extends ITracable {
  _id: string;
  // Type du contrat
  contract_type: ContractType;
  // Version d'un contrat de type TRSP_ROAD
  transport_road?: ITransportRoadContractVersion;
  // Version d'un contrat de type TRANSPORT
  transport?: ITransportContractVersion;
  // Version d'un contrat de type SERVICE
  service?: IServiceContractVersion;
  // Version d'un contrat de type MEANS_ROAD
  means_road?: IMeansRoadContractVersion;
  // Version d'un contrat de type SALES_SCHEME
  sales_scheme?: ISalesSchemeContractVersion;
}

export interface ISalesSchemeContractVersion {
  contract_lines?: IContractLine[];
}

export interface IContractLine {
  formula: ContractFormula;
  fixed_contracts?: ISalesSchemeContractOutput[];
  contracts_grid?: IGrid;
}

export interface IServiceContractVersion {
  // Délai
  time_limit?: ITimeLimit;
  // Début de comptage du délai
  start_event?: StartEvent;
  // Critères de calcul du prix et des services, parcourir dans l'ordre
  service_lines?: IServiceLine[];
}

export interface ITransportRoadContractInspection {
  pickup?: {
    // données d'inspection concernant les actions obligatoires
    checks?: string[];
    // données d'inspection concernant les dommages par élément endommagé
    damages?: boolean;
  };
  // données d'inspections concernant la livraison
  delivery?: {
    // données d'inspection concernant les actions obligatoires
    checks?: string[];
    // données d'inspection concernant les dommages par élément endommagé
    damages?: boolean;
  };
}
export interface ITransportRoadContractVersion {
  main_tarif?: ITransportRoadContractMainTarif;
  services?: IService[];
  expenses_reinvoicing_rules?: IExpensesReinvoicingRules[];
  inspections?: ITransportRoadContractInspection;
  service_lines?: IServiceLine[];
}

export interface ITransportContractVersion {
  main_tarif?: ITransportContractMainTarif;
  service_lines?: IServiceLine[];
}

export interface ITransportContractMainTarif {
  // Délai
  time_limit: ITimeLimit;
  // Critères de calcul du prix, parcourir dans l'ordre
  pricing_lines: IPricingCriterion[];
  // Début de comptage du délai
  start_event: StartEvent;
}

export interface ITransportRoadContractMainTarif extends ITransportContractMainTarif {
  // Malus si véhicule non roulant (si rolling_vehicles_only = false) => UNIQUEMENT POUR TRSP_ROAD
  non_rolling_fixed_malus?: number; // par vin
}

export interface ITransportServiceFixedService {
  code?: string;
  name?: string;
  mandatory?: boolean;
  activity_code?: string;
  base_price?: number;
  unit_price?: number;
  frequency?: number;
  threshold?: number;
  time_limit: ITimeLimit;
}

export interface IMeansRoadContractVersion {
  main_tarif?: ITMeansRoadContractMainTarif;
}

interface ITMeansRoadContractMainTarif {
  // Critères de calcul du prix, parcourir dans l'ordre
  pricing_lines?: IPricingCriterion[];
}

export interface IServiceLine {
  formula: ServicesFormula | ServicesFormulaOrder;
  fixed_services?: IService[];
  services_grid?: IGrid;
}

export interface IExpensesReinvoicingRules {
  group: string;
  type: string;
  invoicing: boolean;
  mark_up?: number;
  derogatory_article?: string;
  derogatory_activity_code?: string;
}
