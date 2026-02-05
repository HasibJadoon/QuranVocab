import { ITransportOrder } from './transport-order.model';
import { IPath, ITrip } from './trip.model';
import { IMemberRole } from './member-role.model';
import { IDocumentLink, IGeoposition, ILocalDate, IRate, ITransition } from './types.model';
import { LockingStatus } from './domains/locking-status.domain';
import { LockingType } from './domains/locking-type.domain';
import { IAppointment } from './appointment.model';
import { IPricing } from './pricing.model';
import { IFullInspection } from '../inspection/inspection.model';
import { IService } from './service.model';
import { IDeliveryRefusal } from './delivery-refusal.model';

export interface IVehicle {
  _id: string;
  // L'id du vehicule parent
  x_vehicle?: string;
  // Référence externe
  x_vin?: string;
  // Numéro de vin
  vin?: string;
  // numéro de voyage externe provenant du systeme groupeur (FVL)
  external_trip_no?: string;
  // Immatriculation
  license_plate?: string;
  // Si le vehicule bouge ou pas
  moving?: boolean;
  // la reference vers la liste des inspection a faire sur le vehicule
  inspection?: string;
  description?: IDescription;
  // Client du vehicle
  customer?: IMemberRole;
  // La date / heure de mise à disposition du VIN
  mad_date?: ILocalDate;
  // La date de livraison souhaitée au plus tôt
  earliest_dls_date?: ILocalDate;
  // la date de livraison souhaité (forcée par FVL)
  forced_dls_date?: ILocalDate;
  // DLS Cliente
  customer_dls_date?: ILocalDate;
  // la date de livraison initial stocké après une prise de rdv
  before_appointment_dls_date?: ILocalDate;
  // Allocation date
  last_order_date?: ILocalDate;
  // La date de livraison souhaitée du VIN
  dls_date?: ILocalDate;
  // Information de l'enlèvement
  pickup?: IEndPointVehicle;
  // Information de la livraison
  delivery?: IEndPointVehicle;
  // Livraison finale
  final_delivery?: {
    member_role?: IMemberRole;
    customer?: IMemberRole;
  };
  // Commentaire sur le vehicule
  comment?: string;
  // Commentaire interne
  internal_comment?: string;
  // Accessories comment
  accessories_comment?: string;
  // Parcours théorique
  path?: IPath;
  // Prix de vente au vehicule
  sales_pricing?: IPricing;
  // Prix client de vente au vehicule
  tc_pricing?: IPricing;
  // Prix d'achat au vehicule
  purchase_pricing?: IPricing;
  // Voyage qui contient le vehicule
  trip?: {
    trip_id: string;
    trip_no: string;
  };
  transport_order?: {
    transport_order_id: string;
    transport_order_no: string;
  };
  gefco?: IGefcoVehicle;
  origin_software: string;
  // Dernière position connue du vehicule
  last_position?: IGeoposition;
  attachments?: IDocumentLink[];
  services?: IService[];
  purchase_services?: IService[];
  send_consignment_note?: {
    type?: 'RES' | 'LIV';
    recipients?: Array<string>;
  };
  documents?: {
    cmr_recap?: {
      key: string;
      size: number;
      name: string;
    };
    cmr_by_vehicle?: {
      key: string;
      size: number;
      name: string;
    };
  };
  // type de transport: ROAD / RAIL / SEA
  transportation_means?: string;
  // type d'opération ( opération FVL)
  operation_kind?: string;
  // Priorité
  priority_level?: number;
  // Vendu client
  check_ordered?: boolean;
  // Date du Vendu client
  ordered_date?: ILocalDate;
  // Nombre de véhicules dans un lot (pour EOLE)
  load_vehicles_number?: number;
  // système groupeur de l'opération
  load_builder_software?: string;
  // Code activité dérogatoire (Grille tarifaires)
  derogatory_activity_code?: string;
  // Code article dérogatoire (Grille tarifaires)
  derogatory_article_code?: string;
  // Codification dérogatoire (Grille tarifaires)
  cust_codification?: string;
  cust_value?: string;
  // permet de savoir s'il y a un blocage actif ou non (IP uniquement)
  check_lock: boolean;
  // Tableau de blocages
  lockings: ILocking[];
  // Code incoterm dérogatoire (Grille tarifaires)
  derogatory_incoterm_code?: string;
  // Informations additionnels incoterm dérogatoire (Grille tarifaires)
  derogatory_incoterm_additional_info?: string;
  // ajouté au modèle uniquement si demandé en query lors d'un search ou d'un get
  full_inspection?: IFullInspection;
  // zone de livraison
  delivery_area?: IArea;
  // zone de livraison
  pickup_area?: IArea;
  // corbeille
  basket?: IBasket;
  estimated_delay?: {
    value: number;
    level: 0 | 1 | 2;
  };
  cmr?: {
    cmr_recorded: boolean;
    recorded_date: Date;
    document?: IDocumentLink;
  };
  manifest?: {
    manifest_no: string;
  };
  iveco_reference: IIvecoReference;
  workshop_exit_planned_date: ILocalDate;
  excluded_dc_brain?: boolean;
  customs_clearance?: CustomsClearance;
}

export interface IBasket {
  basket_no: string;
  meaning?: string;
  created_date?: string;
  created_by?: string;
  created_from?: string;
  updated_date?: string;
  updated_by?: string;
  updated_from?: string;
}

// corbeille de groupage (l'objet n'existe pas en base, c'est le regroupements d'infos de plusieurs cache vehicles possédant le même nuléro de corbeille)
export interface IBasketLine {
  _id: string;
  basket_no: string;
  meaning: string;
  basket_users: string[];
  created_date: Date;
  updated_date?: Date;
  principals: IMemberRole[];
  pickups: IMemberRole[];
  vehicles: {
    _id: string;
    vin?: string;
    license_plate?: string;
  }[];
}

export interface ILocking extends Document {
  // Nature de blocage
  locking_kind?: string;
  // Software de création du blocage
  origin_software?: string;
  // Numéro du blocage (au sens du client)
  locking_no?: string;
  locking_level?: ILockingLevel;
  // Site demandé de blocage
  site?: IMemberRole;
  // Statut du blocage
  status: LockingStatus;
  // Date de blocage
  locking_date?: ILocalDate;
  // Date de déblocage
  unlocking_date?: ILocalDate;
  // Date de refus du blocage
  refusal_date?: ILocalDate;
  // Date d’annulation du blocage
  cancel_date?: ILocalDate;
  // Date demandée de déblocage
  requested_unlocking_date?: ILocalDate;
  check_automatic_unlocking?: boolean;
  // créé le.. par..
  transitions: Array<ITransition<LockingStatus>>;
}

export interface ILockingLevel {
  code: string;
  // Niveau de blocage : codification
  transcoding_entity?: string;
  // Niveau de blocage : code externe
  transcoding_x_code?: string;
  // Niveau de blocage : type de blocage
  locking_type: LockingType;
}

export interface IVehicleExtended extends Pick<IVehicle, Exclude<keyof IVehicle, 'trip' | 'transport_order'>> {
  trip?: {
    trip_id: ITrip | string;
    trip_no: string;
  };
  transport_order?: {
    transport_order_id: ITransportOrder | string;
    transport_order_no: string;
  };
}

export interface IArea {
  id: string;
  code: string;
  name?: string;
}

export interface IGefcoVehicle {
  // SHIP_NO from nostra loads
  ship_no: string;
  // JFO/MTO numero de voyage GEFCO
  jfo_no?: string;
  // Ancien JFO/MTO numéro de voyage GEFO
  old_jfo_no?: string;
  x_ship_no?: string;
  x_jfo_no?: string;
  product_code?: string;
  product_id?: string;
  center?: string;
  // id de la vie véhicule FVL
  vehicle_life_id?: string;
  // id de l'opération FVL
  operation_id?: string;
}

export interface ITripVehicleExtended extends IVehicle {
  // clé de regroupement des véhicules pour le pickup
  pickupGroupKey: string;
  // clé de regroupement des véhicules pour le delivery
  deliveryGroupKey: string;
}

export interface IDescription {
  // Longueur en mètres
  veh_length?: number;
  // Largeur en mètres
  veh_width?: number;
  // Hauteur en mètres
  veh_height?: number;
  // Masse en kilos
  veh_weight?: number;
  // Couleur
  veh_color?: string;
  // Loading Factor
  loading_factor?: number;
  // Marque
  maker?: {
    code: string;
    name: string;
  };
  // Modèle
  model?: {
    code: string;
    name: string;
    // Silhouete
    shape?: {
      code: string;
      name: string;
    };
  };
  // occasion(VO) ou neuf(VN)
  veh_condition?: string;
  next_location?: string;
  park_location?: string;
  external_park_location?: string;
  check_expediability?: string;
  shippable_datetime?: string;
  check_unavailable?: boolean;
  availability_date?: ILocalDate;
  product_id?: string;
  gefco_model?: {
    model_code: string;
    // Libellé du model_id (ex : BERLINGO (M5) ELECTRI FRG.COURT H1)
    meaning: string;
    // codification
    codification: string;
    // x_code
    x_code: string;
  };
}

export interface IEndPointVehicle {
  member_role?: IMemberRole;
  // Date réelle d'arrivée sur le site
  onsite_real_date?: ILocalDate;
  // Date réelle d'arrivée dans la zone d'enlèvement
  zone_arrival_real_date?: ILocalDate;
  // Date réelle d'arrivé de l'enlèvement
  start_real_date?: ILocalDate;
  // Date planifié fin de l'enlèvement/Date planifié de livraison
  end_planned_date?: ILocalDate;
  // Date réelle de fin de l'enlèvement
  end_real_date?: ILocalDate;
  // Date réelle de départ de la zone d'enlèvement
  zone_departure_real_date?: ILocalDate;
  // Photos
  photos?: IDocumentLink[];
  // Signature
  signature?: IDocumentLink;
  driver_signature?: IDocumentLink;
  driver_signature_contact?: string;
  // Signataire réel init avec le contact
  signature_contact?: string;
  // la signature n'est pas requise
  signature_not_required?: boolean;
  // Signature attachments
  signature_attachments?: Array<IDocumentLink>;
  // Commentaire
  comment?: string;
  // Rating à l'enlèvement
  rating?: IRate;
  // Prise de rendez-vous
  appointment?: IAppointment;
  // ajoutés au modèle si le tiers a pour pickup un PARK avec guichet automatique (grace à la query third_party_park)
  third_party_role?: string;
  third_party_automated_gate?: boolean;
  third_party_code?: string;
  third_party_moveIt?: string;
  delivery_refusal?: IDeliveryRefusal;
}

export interface ICacheVehicle extends IVehicle {
  charter_id: string;
  // Voyage complet
  full_trip: ITrip;
  // Commande de transport complet
  full_transport_order: ITransportOrder;
}

export interface ICacheVehicleGroup {
  customer: Pick<IMemberRole, 'third_party_id' | 'name'>;
  pickup: Pick<IMemberRole, 'third_party_id' | 'name'>;
  vehicles: Array<Pick<ICacheVehicle, '_id'>>;
}

export interface IIvecoReference {
  ref1: string;
  ref2: string;
  ref3: string;
  ref4: string;
  ref5: string;
}

export interface CustomsClearance {
  customs_type?: string; // "classic_customs" or "transit_customs"
  clearance_no?: string; // ex : "23ES00431130067330"
  clearance_date?: Date;
  clearance_document_type?: string; // "DUA", "JEC", "TEX" or "STO"
  clearance_document_group?: string; // ex : "00032"
}
