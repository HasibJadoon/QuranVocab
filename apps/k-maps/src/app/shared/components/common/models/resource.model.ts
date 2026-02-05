import { ResourceType } from './domains/resource-type.domain';
import { IDatedDetailedGeoPosition } from './tracking.model';
import { VariableCostElementType } from './domains/variable-cost-element-type.domain';
import { ILocalDate } from '@lib-shared/common/models/types.model';
import { OperationalResourceStatus } from '@lib-shared/common/models/domains/operational-status.domain';
import { ILastMessage, IUnRead } from '@lib-shared/common/chat/business/model/chat-discussion.model';
import { IMemberRole } from '@lib-shared/common/models/member-role.model';
import { Frequency } from './domains/frequency.domain';
import { IUnavailable } from '../../../../../dispatcher/src/app/business/models/resource-unavailable.model';
import { ITarifDetails } from './pricing.model';

/**
 * Ressource du carrier
 */
export interface IResource {
  _id?: string;
  // Nom de la ressource,
  // change si c'est un truck ou un driver
  _label?: string;
  // Ressource du transporteur
  carrier_id?: string;
  // Code de la ressource
  code: string;
  // Type de ressource
  type: ResourceType;
  // Tags
  tags: string[];
  // Type conducteur
  comment: string;
  // commentaire
  driver?: IDriverResource;
  // Type camion
  truck?: ITruckResource;
  // contrat
  mre_contracts?: IMeansRoadContract[];

  // Date de fin d'affichage dans le planning
  end_date_display?: string;

  provider?: {
    third_party_id: string;
    name: string;
  };

  last_position: IDatedDetailedGeoPosition;
  // statut de la ressource
  disabled: boolean;
  disabled_date: Date;
  variable_cost_elements: IVariableCostElement[];
  // statut opérationel de la resource
  resource_details: {
    status: OperationalResourceStatus;
    date: ILocalDate;
  };
  // utilisateur de l'app driver associé à la ressource
  driver_app_username?: string;
  // expertise
  expertises?: string[];
  attachment_point?: IAttachmentPoint;
  tarif_details?: ITarifDetails;
}

export interface IAttachmentPoint {
  location: IMemberRole;
  frequency: Frequency;
  last_passage_date?: string;
}

export interface IResourceState {
  _id: string;
  truck_resource?: {
    code: string;
    truck: ITruckResource;
  };
  driver_resource?: {
    code: string;
    driver: IDriverResource;
  };
  resource_details: {
    status: OperationalResourceStatus;
    date: ILocalDate;
  };
  in_progress_infos?: {
    delivery_nb: number;
    delivery_nb_done: number;
  };
  unread_messages: IUnRead[];
  last_messages: ILastMessage[];
  discussion_id: string;
  repositioning?: IRepositioning;
  tags?: string[];
  delivery_area?: IDeliveryArea;
  unavailables?: IUnavailable[];
  resource_comments?: string[];
}

export interface IDeliveryArea {
  code: string;
  name: string;
}

export interface IRepositioning {
  third_party: IRepositioningThirdParty;
  date?: ILocalDate;
}
export interface IRepositioningThirdParty {
  // Third party id
  id: string;
  // Code du tiers
  code: string;
  // Code gefco du tiers
  gefco_code?: string;
  // Nom du tiers
  name: string;
  // Ville du tiers
  city: string;
}

export interface IMeansRoadContract {
  contract_id: string;
  code: string;
  name: string;
  pricing_code?: string;
  pricing_type?: string;
  application_start_date?: string;
  application_end_date?: string;
}

export interface IVariableCostElement {
  _id?: string;
  carrier_id: string;
  date: string;
  resource_id: string;
  cost_type: VariableCostElementType;
  quantity: number;
  identification: string;
  code: string;
  fleet_owner?: {
    third_party_id: string;
    name: string;
  };
  tags?: string[];
  type: ResourceType;
  enabled: boolean;
}

export interface IDriverResource {
  id?: string;
  username?: string;
  first_name: string;
  last_name: string;
}

export interface ITruckResource {
  // Nom camion
  name: string;
  // Type de camion
  means_type: string;
  // Immatriculation
  license_plate: string;
  // Registration date
  registration_date: string;
  // Motorisation du tracteur
  means_motorisation: IMeansMotorisation;
  // Critere de pollution du tracteur
  pollution_criterion: string;

  trailer: ITrailerResource;
}
export interface ITrailerResource {
  license_plate: string;
  carrying_capacity: string;
  loading_factor: string;
}

export interface IMeansMotorisation {
  // Code de la motorisation
  code: string;
  // Nom de la motorisation
  name: string;
  // Emission de CO2 pour cette motorisation
  co2_emission: number;
}
