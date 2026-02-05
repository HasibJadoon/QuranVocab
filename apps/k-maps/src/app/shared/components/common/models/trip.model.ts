import { IVehicle, IVehicleExtended } from './vehicles.model';
import { IContractTrsp, ITransportOrder } from './transport-order.model';
import { IGeoposition, ILocalDate, IRate, ITracable, ITransition } from './types.model';
import { TripInvoiceStatus, TripStatus } from './domains/trip-status.domain';
import { IMemberRole } from './member-role.model';
import { IPricing } from './pricing.model';
import { ValorizationActionsFilterEnum } from '@lib-shared/common/piloting/valorization-actions.domain';
import { INationality } from './nationality.model';

export interface ITrip extends ITracable {
  _id: string;
  charter_id?: string;
  valorizationAction?: ValorizationActionsFilterEnum;
  // Numéro du voyage interne : use generate sequence
  trip_no: string;
  // Numéro du voyage externe
  x_trip_no?: string;
  // Tags pour identifier la commande
  tags: string[];
  // experertise reqise pour la ressource
  required_expertise?: Array<string>;
  // commentaire
  comment?: string;
  // Statut du voyage
  status: TripStatus;
  // Les transitions du voyage
  transitions: Array<ITransition<TripStatus>>;
  // Rating du client
  rating?: IRate;
  // Date de cloture
  closed_date?: Date;
  // Origin du premier TO qui a créer le trip cf JM
  origin_software: string;
  // Contrat d'achat
  contract_trsp?: IContractTrsp;
  // Prix d'achat au voyage
  purchase_pricing?: IPricing;
  // Parcours théorique de la commande
  path?: IPath;
  // Origine de la commande
  origin: IEndPoint;
  // Destination de la commande
  destination: IEndPoint;
  // Supplier du voyage
  supplier?: ITripSupplier;
  // cas commande de moyen
  transport_order?: {
    transport_order_id: string;
    transport_order_no: string;
  };
  // type de voyage ROUTE FER MER
  transportation_means?: string;
  // Liste des vehicules
  vehicles?: IVehicle[];
  // invoiced status
  invoiced?: boolean;
  // last position
  last_position?: IGeoposition;
  locked?: ILocked;
  // international trip
  international_trip?: INationality;

  archive_fvl_all_vins?: boolean;

  vehicles_location_activity_type?: string;
}

export interface ILocked {
  vehicles?: boolean;
  resource?: boolean;
  date?: boolean;
}

export interface ITripExtended extends Pick<ITrip, Exclude<keyof ITrip, 'transport_order' | 'vehicles'>> {
  vehicles: IVehicleExtended[];
  transport_order?: {
    transport_order_id: ITransportOrder;
    transport_order_no: string;
  };
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

export interface IEndPoint {
  member_role: IMemberRole;
  // Date souhaité à l'arrivé
  desired_date?: ILocalDate;
  // Date plannifié à l'arrivé
  planned_date?: ILocalDate;
  // Date réelle de départ
  real_date?: ILocalDate;
  initial_date?: ILocalDate;
}

export interface ITripSupplier {
  supplier_id: string;
  // Nom du supplier
  name: string;
  // role courant du supplier
  current_role?: 'CHARTER' | 'CARRIER' | 'EXTERNAL';
  // par quel logiciel ce carrier est t'il gerer ?
  software?: string;
  // Resource qui éxécute le voyage
  resource?: ITripSupplierResource;
  // Contenu du mail
  mail?: ITripMail;
}

export interface ITripSupplierResource {
  // id de la resource
  resource_id: string;
  // Type de moyen (DRIVER ou TRUCK)
  type: string;
  // Nom du moyen
  name?: string;
  // Immatriculation, no de wagon
  identification?: string;
  // Propriétaire de la ressource
  owner?: string;
  // Id du propriétaire de la ressource
  owner_id?: string;
  // Code de la ressource
  code?: string;
}

export interface IPuchaseInvoicing {
  // statut d'achat
  purchase_status?: TripInvoiceStatus;
  // commande d'achat carrier externe
  charter_purchase_order?: string;
  // status précédent
  previous_status?: TripInvoiceStatus;
  // numéro de facture fournisseur
  supplier_invoice_number?: string;
}

export interface ITripMail {
  sent_date: string;
  user: string;
  emails: string[];
  total_price: string; // prix du trip
  supplier_id: string;
  min_dls_date: string;
}
