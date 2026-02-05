import { LocationKind } from './domains/location-kind.domain';
import { ExecutionCondition } from './domains/execution-condition.domain';
import { RunUp } from './domains/run-up.domain';
import { IDerogatory } from './derogatory.model';
import { ServiceType } from '../contract/service-type.domain';
import { ILocalDate, IMeaning } from './types.model';
import { ITimeLimit } from '../contract/contract.model';
import { UnitKindMRE } from './domains/unit-kind-MRE.domain';
import { PriceUnitKind } from './domains/price-unit-kind.domain';

export enum DynamicBilledCustomer {
  DELIVERY = 'delivery',
  FINAL_DESTINATION = 'final_destination',
  OWNER = 'owner'
}

export interface IService {
  // _id du service
  _id?: string;
  // type de service (au VIN ou au voyage)
  type?: ServiceType;
  // Code
  code?: string;
  // Code externe
  x_code?: string;
  // Nom
  name?: IMeaning;
  // Prix
  price?: number;
  // Service réccurent
  recurring_service?: IRecurringService;
  // obligatoire ?
  mandatory?: boolean;
  // Type de localisation
  location_kind?: LocationKind;
  // Condition d'exécution
  execution_condition?: ExecutionCondition;
  // Remontée d'exécution (IMPLICIT/EXPLICIT)
  run_up?: RunUp;
  // Dates de début et fin du service
  service_date?: IServiceDate;
  // Délai
  time_limit?: ITimeLimit;
  // Informations dérogatoires
  derogatory?: IDerogatory;
  tarif_detail?: string;
  // Covered or uncovered position.
  is_covered?: boolean;
  dynamic_billed_customer?: DynamicBilledCustomer;
  // used to apply services
  unit_kind?: UnitKindMRE | PriceUnitKind;
}

interface IRecurringService {
  // Prix de base du service
  base_price?: number;
  // Prix unitaire
  unit_price?: number;
  // Fréquence
  frequency_days?: number;
  // Nombre de jours ignorés
  nb_days_ignored?: number;
  // Dates de regroupement
  billing_regrouping_dates?: ILocalDate[];
}

interface IServiceDate {
  // Date de début du service (ou début de la période du pricing)
  start_date?: ILocalDate;
  // Date de fin du service (ou fin de la période du pricing)
  end_date?: ILocalDate;
}
