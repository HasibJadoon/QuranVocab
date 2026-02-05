import { ITracable, IGeoposition, IGeometryCollection, IUsable } from '../models/types.model';
import { IInfoContact } from '../models/info-contact.model';
import { ThirdPartyRole } from './third-party-role.domain';
import { ITranscoding } from '../models/transcoding.model';
import { StockType } from './stock-type.domain';
import { TransportMode } from './transport-mode.domain';
import { CharterSystem } from './charter-system.domain';

/**
 * Tiers opérationnel
 */
export interface IThirdParty extends ITracable, IUsable {
  _id: string;
  third_party_id: string;
  // Code du tiers
  code: string;
  // Code gefco du tiers
  gefco_code?: string;
  // Nom du tiers
  name: string;
  // Complément nom du tiers
  name2?: string;
  // Place id
  place_id: string;
  // Place name
  place_name: string;
  // Adresse 1
  address1?: string;
  // Adresse 2
  address2?: string;
  // Adresse 3
  address3?: string;
  // Code postal
  zip: string;
  // Ville
  city: string;
  // Département
  state?: string;
  // Pays
  country: {
    // Code iso du pays (ex fr)
    code: string;
    // Nom du pays dans la langue du pays
    name: string;
  };
  // Timezone du lieu ex : Europe/Paris
  timezone?: string;
  // Position geographique
  geoposition: IGeoposition;
  // Aire en polygones
  area: IGeometryCollection;
  // Contact du member role
  contacts: IInfoContact[];
  // Entités
  entities: string[];
  // Liste des roles
  roles: ThirdPartyRole[];
  // Context pour le role du donneur d'ordre
  principal?: {
    authorize_empty_service_contracts: boolean;
    check_invoice_at_fictive_exit: boolean;
  };
  // Context pour le role enlèvement
  pickup?: any;
  // Context pour le role livraison
  delivery?: any;
  // Context pour le role facturé
  invoice?: any;
  // Context pour le role transporteur
  carrier?: {
    software?: string;
    block_start_until_planned: boolean;
    restrict_driver_app_to_1_rto: boolean;
    driver_locked_rto_stops_sequence: boolean;
  };
  // Context pour le role parc
  park?: {
    contacts?: Array<IInfoContact>;
    capacity?: number;
    platform_agent?: {
      platform_agent_id: string;
      platform_agent_code: string;
    };
    ext_system?: string;
    automated_gate?: boolean;
    specific_cmr?: boolean;
    collection_print_alert?: boolean;
    print_customs_document?: boolean;
    check_road?: boolean;
    check_rail?: boolean;
    check_sea?: boolean;
    short_meaning?: string;
  };

  platform?: {
    capacity?: number;
    platform_agent?: {
      platform_agent_id: string;
      platform_agent_code: string;
    };
    ext_system?: string;
    check_road?: boolean;
    check_rail?: boolean;
    check_sea?: boolean;
    check_container?: boolean;
    check_relay_point?: boolean;
    short_meaning?: string;
    // Date estimée de fin calculée par l’exécutant
    check_estimated_end_date_managed_by_exec?: boolean;
    ext_system_for_loads?: string;
    check_no_receipt_exit?: boolean;
    check_ddt_printing?: boolean;
    check_ntd_printing?: boolean;
    check_nomad_server?: boolean;
    nomad_server_url?: string;
    secondary_platforms?: Pick<IThirdParty, '_id' | 'code' | 'gefco_code' | 'name'>[];
    docks: string[];
    // Sur l'APP compound, indique si les véhicules sur ce compound seront régularisés manuellement
    check_manual_regularize_surplus?: boolean;
    check_contract_service?: boolean;
    // Sur l'APP compound, indique que pour ce centre on veut déclarer les places vides manuellement lors de l'inventaire
    check_empty_square_inventory?: boolean;
    check_covered_stock?: boolean;
    check_customs_area?: boolean;
    // Ajout pour pouvoir valider à la main les véhicules ‘NL’ et ‘LV’
    check_manual_validation_inventory?: boolean;
  };

  // contexte pour le role branch (agence)
  branch?: {
    code: string;
  };
  // Context pour le role obtpop
  obtpop?: any;
  obcenter?: any;
  obplatform?: any;
  // Transcodage
  transcoding: ITranscoding[];
  // Software utilisé par le transporteur
  carrier_software: string;
  // Champs pour les recherches
  text?: string;
  // Comptabilité
  legal_entity?: ILegalEntity;
  // Interne (Groupe GEFCO) / Externe
  intern?: boolean;
  // Entité juridique associée
  associated_legal_entity?: {
    _id: string;
    name: string;
  };
  // Code d'agence
  agency?: string;
  // Code cluster
  cluster?: string;
  stock_account?: IStockAccount;
  tags?: {
    kind: string;
    values?: string[];
  }[];
  // Désactive le tiers
  disabled?: boolean;
  interested_third_parties?: {
    _id: string;
    name: string;
  }[];
  // Extension de langage
  language_extension?: string;
  // Context pour le role dispatcher
  charter?: {
    transport_mode: TransportMode;
    software?: CharterSystem;
    check_block_charter_to_charter?: boolean;
    specific_cmr?: boolean;
    print_4_copies?: boolean;
    check_vehicle_accessories_comment?: boolean;
    hidden_pickup_damages?: boolean;
    list_hidden_pickup_damages?: string[];
    driver_barcode_pickup_points?: string[];
    show_trip_and_truck_plate_barcodes?: boolean;
  };
  // Contact de facturation
  billing_contact?: IBillingContact;
  third_party_type?: string;
  customer_kind?: string;
  market?: string;
  // Identification PSA
  external_ref2_no?: string;
  // Identification client externe
  external_ref3_no?: string;
  // Instructions
  instructions?: string;
  local_market_countries?: {
    _id: string;
    code: string;
    name: string;
  }[];
  // dates de clotures
  closing_dates?: ClosingDate[];
  // Horaires d'ouverture pour chaque jour
  opening_hours?: IOpeningHours[];

  // Délai minimal de prévenance d'un TP au départ d'un centre
  cut_off_rules?: ICutOffRules;

  // Date au plus tard, par rapport au pickup d'un TP, à laquelle on peut dégrouper un TP
  ungroup_max_date_rule?: IMaxDateRule;
  // Date au plus tard, par rapport au pickup d'un TP, à laquelle on peut modifier un TP (ressource ou horaires))
  update_max_date_rule?: IMaxDateRule;
  // Temps d'attente
  waiting_time?: number;
  network?: {
    third_parties: {
      _id: string;
      name: string;
      gefco_code: string;
      code: string;
    }[];
  };
}

export enum DelayType {
  // Heures
  HOURS = 'HOURS',
  // Jours
  DAYS = 'DAYS',
  // Jours ouvrés
  WORKING_DAYS = 'WORKING_DAYS'
}

export interface IMaxDateRule {
  // Type (jours / heures / jours ouvrés)
  type: DelayType;
  // Nombre d'heures ou de jours
  value: number;
}

export interface ICutOffRules {
  // Type (jours / heures / jours ouvrés)
  type: DelayType;
  // Nombre d'heures ou de jours
  value: number;
  // Heure de cut-off :
  optional_cut_off_hour?: string;
}

export enum DayOfWeek {
  MONDAY = 1,
  TUESDAY,
  WEDNESDAY,
  THURSDAY,
  FRIDAY,
  SATURDAY,
  SUNDAY
}

export interface IOpeningHours {
  // Jour (lundi 1, mardi 2, etc)
  date: IOpeningHoursDate;
  // Ouvert ou non?
  open: boolean;
  // Horaires d'ouverture
  periods?: IPeriod[];
}

export interface IOpeningHoursDate {
  date_no: DayOfWeek;
  name: string;
}

interface IPeriod {
  // Horaire début, HH:mm
  start_time: string;
  // Horaire fin, HH:mm
  end_time: string;
}
export interface ClosingDate {
  date: string;
  closing_period: string;
}

export interface IBillingContact {
  address?: boolean;
  contact?: boolean;
  address_info?: {
    //name
    name?: string;
    // Place id
    place_id: string;
    // Place name
    place_name: string;
    // Adresse 1
    address1?: string;
    // Adresse 2
    address2?: string;
    // Adresse 3
    address3?: string;
    // Code postal
    zip: string;
    // Ville
    city: string;
    // Pays
    country: {
      // Code iso du pays (ex fr)
      code: string;
      // Nom du pays dans la langue du pays
      name: string;
    };
  };
  contacts_info?: IContactInfo[];
}

export interface IContactInfo {
  // Nom prénom
  name?: string;
  // Téléphone
  phone?: string;
  // Email
  email?: string;
  // La langue pour dialoguer avec lui
  language?: string;
}

export interface ILegalEntity {
  legal_form?: string;
  legal_entity_code?: string;
  derogatory_gact_code?: string;
  share_capital?: number;
  currency: string;
  siret: string;
  rcs?: string;
  rcs_city?: string;
  // code SAP
  sap_code: string;
  // numero de TVA
  vat_no?: string;
  legal_entity_software?: ILegalEntitySoftware;
  // envoi vers SAP
  sending_documents?: SendingDocuments;
}

export enum TagsKind {
  customer = 'customer'
}

export enum ILegalEntitySoftware {
  NONE = 'NONE',
  MOVEECAR_ACCOUNTING = 'MOVEECAR_ACCOUNTING'
}

export enum SendingDocuments {
  NO = 'NO',
  SAPGEFCO = 'SAPGEFCO'
}

export interface IStockAccount {
  // Localisation du stock
  platform: {
    _id: string;
    name: string;
    platform_agent?: {
      platform_agent_id: string;
      platform_agent_code: string;
    };
    ext_system?: string;
  };
  // Client donneur d'ordre
  principal?: {
    _id: string;
    name: string;
  };
  // Prestation de stockage
  check_stock_work_order?: boolean;
  // Type de stock
  stock_type?: StockType;
  // Type de préstation
  vehicle_service?: {
    id: string;
    code: string;
  };
  // Rang
  sequence?: number;
  // Protégée : n'est pas annulée par une nouvelle affectation
  check_protected?: boolean;
  // Durée minimum en minutes
  minimum_duration?: number;
  // Débuté automatiquement à la création
  check_started_on_create?: boolean;
  // Débute si l’opération de centre débute
  check_started_with_center_operation?: boolean;
  // Débuté par le début d’une prestation de douane
  check_started_with_custom_work?: boolean;
  // Débuté par l’outil de parc
  check_started_by_park_software?: boolean;
  // Débute à la remise à Gefco (RTR)
  check_started_with_gefco_given?: boolean;
  // Terminé par l’affectation à un nouveau compte de stock (sur le même centre)
  check_ended_with_new_stock_allocation?: boolean;
  // Terminé par la réalisation d’une prestation de douane
  check_ended_with_custom_work?: boolean;
  // Termine si l’opération de centre est terminée (expédition)
  check_ended_with_center_operation?: boolean;
  // Terminé si Opération de Transport planifiée (MADT, RTR)
  check_ended_on_transport_planned?: boolean;
  // Terminé par l’outil de parc
  check_ended_by_park_software?: boolean;
  // Terminé à la remise à Gefco (RTR)
  check_ended_with_gefco_given?: boolean;
  // Terminé à réception d’un call-off
  check_ended_on_call_off?: boolean;
}
