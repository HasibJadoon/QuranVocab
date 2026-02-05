import { ITracable } from './types.model';
import { IMemberRole } from './member-role.model';
import { IPricing } from './pricing.model';
import { IEndPoint, IPath, ITrip } from './trip.model';
import { IVehicle, IVehicleExtended } from './vehicles.model';
import { TransportOrderInvoiceStatus, TransportOrderStatus } from './domains/transport-order-status.domain';
import { PodStatus } from './domains/pod-status.domain';
import { ServiceType } from './domains/service-type.domain';
import { InvoicingSoftware } from '../contract/invoicing-software.domain';
import { PaymentTerm } from '@lib-shared/common/accounting/accounting-document.domain';
import { TransportRoadType } from '../contract/transport-road-type.domain';

export interface ITransportOrder extends ITracable {
  _id?: string;
  charter_id?: string;
  // Numéro de la commande interne
  transport_order_no?: string;
  // Reference externe de la commande
  x_transport_order_no?: string;
  // commentaire
  comment?: string;
  // Statut de la commande
  status?: TransportOrderStatus;
  // Tags pour identifier la commande
  tags?: string[];
  // experertise reqise pour la ressource
  required_expertise?: Array<string>;
  // Donneur d'ordre de la commande
  principal?: IMemberRole;
  // Facturé de la commande
  billed?: IMemberRole;
  // Contrat de la commande
  contract_trsp?: IContractTrsp;
  // Prix de vente de la commande
  sales_pricing?: IPricing;
  // Origine de la commande
  origin: IEndPoint;
  // Destination de la commande
  destination: IEndPoint;
  // Parcours théorique de la commande
  path?: IPath;
  // Date de cloture
  closed_date?: Date;
  // Origine du system de création de la commande
  origin_software?: string;
  // Vehicules
  vehicles?: IVehicle[];
  // status de invoicing accounting
  invoiced?: boolean;
  // Voyage commande de moyen
  trip?: {
    trip_id: string;
    trip_no: string;
  };
  // invoicing: facturation
  invoicing?: IInvoicing;
  offer?: IOffer;
  // Verification des PODS
  pod?: {
    status: PodStatus;
  };
  purchase_order?: string;
}

export interface IContractTrsp {
  // Id du contrat de transport
  contract_trsp_id?: string;
  // Nom du contrat
  name?: string;
  // currency
  currency?: string;
  // Type de service
  service_type?: ServiceType;
  // Type de transport road
  transport_type?: TransportRoadType;
  // elements servant a la valorisation
  valorization?: {
    // invoicing software
    invoicing_software?: InvoicingSoftware;
  };
  frozen?: boolean;
}

export interface IInvoicing {
  // elements de facturation vente propres au transport order
  transport_order?: {
    // reference au snapshot du transportorderaccounting
    transport_order_accounting_id?: string;
    // statut de facturation
    status: TransportOrderInvoiceStatus;
    // cle interne du fichier dotax
    invoice_file_key?: string;
    // date creation du dotax
    invoice_creation_date?: Date;
    // identifiant SAP apres upload dotax
    invoice_external_id?: string;
    // ligne dans le dotax
    invoice_file_line_index?: number;
  };
  legal_entity?: {
    billing_calendar?: string;
    payment_term?: PaymentTerm;
  };
}

export interface IOffer {
  code?: string;
  price?: number;
  names?: {
    en: string;
    fr: string;
  };
}

export interface ITransportOrderExtended extends Pick<ITransportOrder, Exclude<keyof ITransportOrder, 'trip' | 'vehicles'>> {
  vehicles: IVehicleExtended[];
  trip?: {
    trip_id: ITrip;
    trip_no: string;
  };
}
