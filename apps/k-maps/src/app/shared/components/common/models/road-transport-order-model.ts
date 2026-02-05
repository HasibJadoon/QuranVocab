import { IDeliveryRefusal } from '@lib-shared/common/models/delivery-refusal.model';
import { RoadTransportOrderStatus } from '@lib-shared/common/models/domains/road-transport-order-status.domain';
import { IExpense } from '@lib-shared/common/models/expense.model';
import { IMeansRoadContract, IResource } from '@lib-shared/common/models/resource.model';
import { IDatedDetailedGeoPosition } from '@lib-shared/common/models/tracking.model';
import { ILocking } from '@lib-shared/common/models/vehicles.model';
import { CurrencyEnum } from '@lib-shared/common/services/currency.service';
import { IFullInspection } from '../inspection/inspection.model';
import { IAppointment } from './appointment.model';
import { ManifestStatus } from './domains/manifest-status.domain';
import { Period } from './domains/period.domain';
import { Pod } from './domains/pod.domain';
import { ResourceType } from './domains/resource-type.domain';
import { VariableCostElementType } from './domains/variable-cost-element-type.domain';
import { IMemberRole } from './member-role.model';
import { IPricing, IPricings } from './pricing.model';
import { IDocumentLink, ILocalDate, IRate } from './types.model';
import { INationality } from '@lib-shared/common/models/nationality.model';

export interface IRoadTransportOrder {
  _id?: string;
  // Numéro de la commande interne
  order_no?: string;
  // Reference externe de la commande
  x_order_no?: string;
  // Donneur d'ordre de la commande
  principal?: IMemberRole;
  // Facturé de la commande
  billed?: IMemberRole;
  // Contrat
  contract?: {
    // id du contrat
    contract_id: string;
    // Nom du contrat
    name: string;
    // Devise du contrat
    currency: string;
  };
  // Prix de la commande
  price?: number;
  // Resource
  resource: IRtoRessource;
  resources?: IRtoRessource[];
  // Contrat associé à la ressource principale du RTO
  main_mre_contract?: IRtoDfcMreContract;
  // Les bon de transport
  manifests?: IManifest[];
  // Date de début
  start?: IStart;
  // Date de fin
  end?: IEnd;
  // Status de la commande
  status?: RoadTransportOrderStatus;
  // Commentaire simple
  comment?: string;
  // Commentaire sur la commande
  comments?: any[];
  // Date de cloture
  closed_date?: Date;
  // Origine du system de création de la commande
  origin_software?: string;
  // Note de frais
  expense_ids?: string[];
  expensesGroupByCurrency?: IExpensesGroupByCurrency[];
  // Liste des tags
  tags?: string[];
  // expertises requises pour la ressource
  required_expertise?: Array<string>;
  // Rating
  rating?: IRate;
  created_by?: string;
  created_date?: Date;
  updated_by?: string;
  updated_date?: Date;
  costs: ICosts;
  invoiced?: boolean;
  carrier_id?: string;
  // Last position
  last_position?: IDatedDetailedGeoPosition;
  // Itinéraire du RTO
  route?: ISegmentRoute[];
  // indique si l'itinéraire est geler
  frozen?: boolean;
  // RTO parents, dans le cas de la rupture
  parents: {
    rto_id: string;
    order_no: string;
    x_order_no?: string;
  }[];
  // Enfant du rto
  child?: {
    // Type de rupture
    type: 'fusion' | 'break';
    // Type fusion
    fusion?: {
      // Le rto qui contient la fusion
      rto: {
        rto_id: string;
        order_no: string;
      };
    };
    // Type rupture
    break?: {
      // RTO de départ
      start_rto: {
        rto_id: string;
        order_no: string;
      };
      // RTO de fin
      end_rto: {
        rto_id: string;
        order_no: string;
      };
      // Separateur
      separator: {
        // Rang par rapport au RTO
        rank: number;
        // Lieu de la séparation
        member_role?: IMemberRole;
      };
    };
  };
  // couleur
  color?: string;
  // prix
  pricing?: IPricing;
  // chevauchement
  overlap?: boolean;
  // true si un des véhicules est vendu client
  at_least_check_ordered?: boolean;
  // plus faible valeur de priorité sur les véhicules
  at_least_priority_level?: number;

  transport: {
    status: string;
    start_real_date: ILocalDate;
  };
  // Loading Factor
  loading_factor?: number;
  // pickup/delivery points in RTO
  stop_count?: {
    pickup?: number;
    delivery?: number;
  };

  // national or international RTO
  international_trip?: INationality;
  // MRE  data
  mre_data?: IMREData;
}

export interface IPricedResource {
  resource: IResource;
  pricingLoading: boolean;
  mreContract?: IMeansRoadContract;
  pricings?: IPricings;
}

export interface IMREData {
  rto?: {
    country_crossed?: ICountryCrossed[];
  };
}

interface IRtoDfcMreContract {
  // id contrat
  contract_id: string;
  // code contrat
  code: string;
  // nom du contrat
  name: string;
  // nom du forunisseur
  provider_name?: string;
  // devise de la version, par défaut €
  currency: string;
  // code du tarif, défini dans la ressource
  pricing_code?: string;
  // option de calcul de distance pour Padroncini
  trips_distance_calculation?: boolean;
}

export interface IVehicleSegmentRoute {
  _id: string;
  loading_factor: number;
}

export interface IEndPointSegmentRoute {
  member_role: IMemberRole;
  is_pickup: boolean;
  manifests_id?: string[];
  start_real_date?: ILocalDate;
  end_real_date?: ILocalDate;
  end_planned_date?: ILocalDate;
  vehicles?: IVehicleSegmentRoute[];
}

export interface ISegmentRoute {
  // Distance entre le point de passage précédent et celui ci
  distance?: number;
  // Durée entre le point de passage précédent et celui ci
  duration?: number;
  // Système utilisé pour le calcul de la distance
  system?: string;
  // Système de calcul de distance réel (pour attachment_point, stocke le système utilisé comme PTV-TRUCK40T)
  distance_system?: string;
  // Indicates if this segment represents an attachment point (return to base)
  is_attachment_point?: boolean;
  // id du rto précédent, calculé
  id_previous_order?: string;
  // id du rto suivent, calculé
  id_next_order?: string;
  // Infos sur le départ du segment
  start?: IEndPointSegmentRoute;
  // Infos sur la fin du segment
  end?: IEndPointSegmentRoute;
  // Reference de la distance PTV40T
  ptv_ref_distance?: number;
}

export interface IStart {
  // Date souhaité au départ
  desired_date?: ILocalDate;
  // Date planifiée - date de positionnement dans le planning (YYYY-MM-DD)
  planned_date: string;
  // Période horaire (matin ou après midi)
  period: Period;
  // Heure planifiée - (hh:mm)
  planned_time?: string;
  // Position sur le planning
  position: number;
  // Date réelle de départ
  real_date?: ILocalDate;
}

export interface IEnd {
  // Desired date of arrival
  desired_date?: ILocalDate;
  // Planned date - date of positioning in the schedule (YYYY-MM-DD)
  planned_date: string;
  // planned date js (for atlas)
  planned_js_date?: Date;
  // Time period (morning or afternoon)
  period: Period;
  // Scheduled time - (hh:mm)
  planned_time?: string;
  // Position on the schedule
  position: number;
  // End date
  real_date?: ILocalDate;
  // time (in s? of the journey)
  duration?: number;
}

export interface IPath {
  // Distance théorique
  distance?: number;
  // Durée théorique
  duration?: number;
  // Distance réelle
  real_distance?: number;
  // Durée réelle
  real_duration?: number;
}

export interface IDelivery {
  member_role?: IMemberRole;
  // Date d'arrivée réelle sur site (à remplir automatiquement par geofencing)
  onsite_real_date?: ILocalDate;
  // Date réelle de début de l'enlèvement
  start_real_date?: ILocalDate;
  // Date réelle de fin de l'enlèvement
  end_real_date?: ILocalDate;
  // Signature
  signature?: IDocumentLink;
  // Signataire réel init avec le contact
  signature_contact?: string;
  // la signature n'est pas requise
  signature_not_required?: boolean;
  // Signature Attachments
  signature_attachments?: Array<IDocumentLink>;
  // Commentaire
  comment?: string;
  // Position du point d'enlèvement parmi l'ensemble des points d'enlèvement / destination du RTO
  location_position?: number;
  // Prise de rendez-vous
  appointment?: IAppointment;
  // delivery refusal
  delivery_refusal?: IDeliveryRefusal;
}

export interface IPickup {
  member_role?: IMemberRole;
  // Date d'arrivée réelle sur site (à remplir automatiquement par geofencing)
  onsite_real_date?: ILocalDate;
  // Date réelle de début de l'enlèvement
  start_real_date?: ILocalDate;
  // Date réelle de fin de l'enlèvement
  end_real_date?: ILocalDate;
  // Signature
  signature?: IDocumentLink;
  // Signataire réel init avec le contact
  signature_contact?: string;
  // la signature n'est pas requise
  signature_not_required?: boolean;
  // Signature Attachments
  signature_attachments?: Array<IDocumentLink>;
  // Commentaire
  comment?: string;
  // Position du point d'enlèvement parmi l'ensemble des points d'enlèvement / destination du RTO
  location_position?: number;
  // ajoutés au modèle si le tiers a pour pickup un PARK avec guichet automatique (grace à la query third_party_park)
  third_party_role?: string;
  third_party_automated_gate?: boolean;
  // Prise de rendez-vous
  appointment?: IAppointment;
}

export interface IRtoVehicle {
  // optionnel (juste en cas de groupage)
  manifest_id?: string;
  // id
  _id?: string;
  // id vehicle dans charter
  x_id?: string;
  // Le vin
  vin?: string;
  // Référence externe du VIN - en général le numéro fourni par le client pour effectuer le suivi
  x_vin?: string;
  // L'immat
  license_plate?: string;
  // L'id de l'inspection associée au véhicule
  inspection?: string | IFullInspection;
  // ajouté au modèle uniquement si demandé en query lors d'un search ou d'un get
  full_inspection?: IFullInspection;
  // Le fabriquant
  maker?: {
    // Le code
    code?: string;
    // Le nom de la voiture ex Peugeot
    name?: string;
  };
  // Le modèle de voiture
  model?: {
    // Le code
    code?: string;
    // Le nom du modèle ex Clio
    name?: string;
    // Silhouette
    shape?: {
      code: string;
      name: string;
    };
  };
  // Si le vehicule bouge ou pas
  moving?: boolean;
  // La date / heure de mise à disposition du VIN
  mad_date?: ILocalDate;
  // La date de livraison souhaitée du VIN
  dls_date?: ILocalDate;
  // Commentaire sur le VIN
  comment?: string;
  attachments?: IDocumentLink[];
  // Information du vehicule sur l'enlèvement
  pickup?: {
    photos?: IDocumentLink[];
    comment?: string;
  };
  // Information du vehicule sur la livraison
  delivery?: {
    photos?: any[];
    comment?: string;
    delivery_refusal?: IDeliveryRefusal;
  };
  services?: Array<any>;
  send_consignment_note?: {
    type: Pod;
    recipients: Array<string>;
  };
  loading_factor?: number;
  warnings?: IVehicleWarning;
  check_unavailable?: boolean;
  availability_date?: ILocalDate;
  trip?: {
    trip_id: string;
    trip_no: string;
  };
  transport_order?: {
    transport_order_id: string;
    transport_order_no: string;
  };
  // permet de savoir s'il y a un blocage actif ou non (IP uniquement)
  check_lock: boolean;
  // Tableau de blocages
  lockings: ILocking[];
  next_location?: string;
  park_location?: string;
  cmr?: {
    cmr_recorded: boolean;
    recorded_date: Date;
    document?: IDocumentLink;
  };
  // Vendu client
  check_ordered?: boolean;
  // Priorité
  priority_level?: number;
}

export interface IManifest {
  _id: string;
  // Code du manifest
  manifest_no?: string;
  // Code externe du manifest
  x_manifest_no?: string;
  // Client du manifest
  customer?: IMemberRole;
  // Liste de vehicules
  vehicles?: IRtoVehicle[];
  // L'enlèvement
  pickup?: IPickup;
  // La livraison
  delivery?: IDelivery;
  // Parcours théorique
  path?: IPath;
}

export interface IVehicleWarning {
  rto_id: string;
  rto_no: string;
  manifest_no: string;
  manifest_id: string;
  vehicle_id: string;
  vin: string;
  x_vin: string;
  licence_plate: string;
  messages: {
    text: string;
    carrier_read: boolean;
    driver_read: boolean;
    created_by?: string;
    created_date?: ILocalDate;
  }[];
  created_by?: string;
  created_date?: ILocalDate;
  updated_by?: string;
  updated_date?: ILocalDate;
  manifest_details?: {
    status: ManifestStatus;
    date: ILocalDate;
  };
}

export interface IRtoRessource {
  // Ajout/modification d'éléments liés à la ressource -> dénormalisation de l'info ?
  resource_id: string;
  // Le nom de la ressource
  name?: string;
  // code de la ressource,
  code?: string;
  // La plaque d'immatriculation d'une ressource
  license_plate?: string;
  // Type de la ressource
  type?: ResourceType;
  // id du propriétaire de ressource
  owner_id?: string;
  pricing?: IPricing;
  pricedResource?: IPricedResource;
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

export interface ICosts {
  // id du rto précédent, calculé par un futur algo (A2), pour faciliter le calcul d'autres algos, pour le moment null
  id_previous_order?: string;
  // adresse de fin du précédent rto, calculé
  previous_order_ending_place?: IMemberRole;
  // id du rto suivant, calculé
  id_next_order?: string;
  // adresse de début du rto suivant, calculé
  next_order_starting_place?: IMemberRole;
  // adresse de départ du rto, calculé par un futur algo (A3), pour le moment null
  starting_place?: IMemberRole;
  // adresse de fin du rto, calculé par un futur algo (A3), pour le moment null
  ending_place?: IMemberRole;
  // somme des frais par devise, calculé (algo existant)
  total_expenses?: {
    currency: string;
    total: number;
  }[];
  distances: {
    // distance totale, calculé par un futur algo (A4), par défaut à 0
    distance_loaded: number;
    // ajustement distance totale, définit directement par le gestionnaire de flotte, par défaut à 0
    distance_loaded_delta: number;
    // distance a vide entre deux rto, calculé par un futur algo (A5), par défaut à 0
    distance_empty: number;
    // ajustement distance à vide totale , définit directement par le gestionnaire de flotte, par défaut à 0
    distance_empty_delta: number;
    // distance a vide entre le rto d'avant et ce rto, calculé, par défaut à 0
    distance_empty_before?: number;
    // distance a vide entre ce rto et le rto d'après, calculé, par défaut à 0
    distance_empty_after?: number;
    // Somme des distance chargé, a vide et les delta associé, calculé, par défaut à 0
    total_distance: number;
    // Distance totale d'un groupe de RTO pour la taxation avec l'option "Padroncini"
    total_grouped_rtos_distance?: number;
    // Calculated distance per country
    distance_per_country?: IDistancePerCountry;
    distance_loaded_delta_country_affected?: string;
    distance_empty_delta_country_affected?: string;
  };
  // ajustement de coût, définit directement par le gestionnaire de flotte, par défaut à 0
  delta_costs: number;
  // coût du rto sans les frais, avec ajustement, calculé (algo existant a modifier), par défaut à 0
  total_costs_without_expenses: number;
  // coût total du rto, dans la devise du contrat, avec frais (algo de conversion de devise à prévoir A6), calculé (algo existant a modifier), par défaut à 0
  total_costs: number;
  // prix bunker
  included_bunker_price: number;
}
export interface IDistancePerCountry {
  loaded: IDistancePerCountryCalculated[];
  empty_before: IDistancePerCountryCalculated[];
  empty_after: IDistancePerCountryCalculated[];
}

export interface IDistancePerCountryCalculated {
  country_code?: string;
  total_distance?: number;
}

export interface IRtoAggregationByResourceWrapper {
  hasRtos: number;
  result: IRtoAggregationByResource | IResource;
}
export class IRtoAggregationByResource {
  price: {
    totalExpenses: number;
    totalCostsWithoutExpenses: number;
    totalCosts: number;
    totalDistanceCosts: number;
    totalDaysActive: number;
    totalDayCosts: number;
    pricing: number;
  };
  km: {
    totalKm: number;
    totalKmLoaded: number;
    totalKmEmpty: number;
  };
  rtos: IRoadTransportOrder[];
  resource: IResource;
}

export interface IExpensesGroupByCurrency {
  expensesGroupByGroup: IExpensesGroupByGroupe[];
  amount: number;
  showDetail: boolean;
  currency: string;
}

export interface ICountryCrossed {
  country_code: string;
  loaded: number | null;
  empty_before: number | null;
  empty_after: number | null;
}

interface IExpensesGroupByGroupe {
  expensesGroupByType: IExpensesGroupByType[];
  amount: number;
  showDetail: boolean;
  groupName: string;
}

interface IExpensesGroupByType {
  expenses: IExpenseShow[];
  amount: number;
  showDetail: boolean;
  type: string;
}

interface IExpenseShow extends IExpense {
  showDetail: boolean;
}
