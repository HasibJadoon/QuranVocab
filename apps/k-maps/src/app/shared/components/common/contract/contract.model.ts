import { GeoPlaceReference } from '@lib-shared/common/geo-zones/geo-zone.model';
import { AccountingDocumentGroup, DotaxHeader, DotaxLineDetail, DotaxLineGroup, IncotermCode, InvoicingMethod, PaymentTerm, ReadyForInvoiceValidatedType } from '../accounting/accounting-document.domain';
import { IMemberRole, ISubscriptionMemberRole } from '../models/member-role.model';
import { ITranscoding } from '../models/transcoding.model';
import { IMeaning, ITracable } from '../models/types.model';
import { IBillingContact, IThirdParty } from '../third-party/third-party.model';
import { MeansRoadArticleCode, ParkServiceArticleCode, TransportArticleCode, TransportRoadArticleCode } from './article-code.domain';
import { AutomatedSendingType } from './automated-sending-type.domain';
import { ContractMirrorType, ContractRoleRestriction, ContractType, OwnerRole, RestrictionPurchaseSales } from './contract.domain';
import { DistributionType } from './distribution-type.domain';
import { EmptyDistanceRetributionOption } from './empty-distance-retribution-options.domain';
import { InvoiceableEvent } from './invoiceable-event.domain';
import { PricingFormula } from './pricing-formula.domain';
import { IPurchaseOrder } from './purchase-order.model';
import { InvoiceDisplaySap, InvoiceLineDetailSap, PreinvoiceDisplaySap } from './sap-detail.domain';
import { ServiceLocationType } from './service-location-type.domain';
import { ServiceType } from './service-type.domain';
import { ServicesFormula } from './services-formula.domain';
import { SlotType } from './slot-type.domain';
import { StartEvent } from './start-event.domain';
import { TimeLimitType } from './time-limit.domain';
import { TransportType } from './transport-type.domain';
import { VehicleBusinessType } from './vehicle-business-type.domain';
import { GridImportStatus } from './grid-import-status.domain';
import { CheckTlInfosType } from '@lib-shared/common/contract/check-tl-infos-type.domain';
import { SalesPreinvoiceSendingType } from './sales-preinvoice-sap-options.domain';

export interface IContract extends ITracable {
  _id?: string;
  // Propriétaire du contrat
  owner?: IMemberRole;
  // Role de l'Owner (Charter, Carrier,...)
  owner_role?: OwnerRole;
  // Fournisseur du contrat
  supplier?: IMemberRole;
  // Tags pour identifier la commande
  tags?: Array<string>;
  // Customer Tags
  customer_tags?: Array<string>;
  // experertise reqise pour la ressource
  required_expertise?: Array<string>;
  // Liste des facturé
  billed_customers?: IMemberRole[];
  // Liste des donneurs d'ordre
  principal_customers?: IMemberRole[];
  // Code du contrat
  code: string;
  // Nom du contrat
  name: string;
  // Type de contrat (TRSP_ROAD, MEANS_ROAD, STORAGE,...)
  type: ContractType;
  // Devise des montants du contrat
  currency?: string;
  // Code activité - redondant avec accounting, pour le moment indispensable
  activity_code?: string;
  // parametres accessibles via dispatcher/accounting/Parametrage_contrat
  accounting?: IContractAccounting;
  // champs propres aux contrats de type TRSP_ROAD
  transport_road?: IContractTransportRoad;
  // champs propres aux contrats de type MEANS_ROAD
  means_road?: IContractMeansRoad;
  // champs propres aux de type SALES_SCHEME
  sales_scheme?: ISalesScheme;
  // champs propres aux contrats de type PARK
  park?: IContractPark;
  // champs propres aux contrats de type SERVICE
  service?: IServiceContract;
  // Transcodage
  transcoding?: ITranscoding[];
  // Purchase order
  purchase_orders?: IPurchaseOrder[];
  // champs propres aux contrats de type TRSP_ROAD
  transport?: IContractTransport;
  // contrat actif ou inactif
  active?: boolean;
  // Fournisseur du contrat derogatoire
  derogatory_supplier?: IMemberRole;
  // international
  international?: boolean;

  mirroring_info?: {
    mirroring_activity_code?: string;
    contractMirrorType?: ContractMirrorType;
  };
}

interface IContractAccounting {
  // Logiciel de facturation - A SORTIR DE IVALORIZATION, par défaut Moveecar
  invoicing_software: string;
  // Passage automatique de facturable à prêt à facturer
  iab_to_rfi?: boolean;
  // Facturable mais en attente de CMR
  waiting_for_cmr?: boolean;
  // origin country is not the same as destination
  international?: boolean;
  // Méthode de facturation (Facture, pré-facture ou auto-facture)
  invoicing_method?: InvoicingMethod;
  // Passage automatique de prêt à facturer à facturé en cours
  rfi_to_ivd?: boolean;
  // RFI Client ou RFI Fournisseur
  rfic_rfis?: ReadyForInvoiceValidatedType;
  // If TL is preinvoiceable
  is_preinvoiceable?: boolean;
  // Facture créée au statut Brouillon - En attente
  draft_pending_before_send?: boolean;
  // Découpage en plusieurs facture
  invoice_group_by?: AccountingDocumentGroup;
  // Invoice Limit
  nb_tls_per_invoice?: number;
  // GAC caculation code
  gac?: string;
  // Sap File Language
  sap_file_lang?: string;
  // VAT
  vat?: boolean;
  // Format en-tête
  invoice_header?: DotaxHeader;
  // Regroupement des lignes de facturation
  invoice_line_group_by?: DotaxLineGroup;
  // Regroupement des lignes de facturation
  invoice_line_detail?: DotaxLineDetail;
  // Paramètres de facturation
  // Fréquence de facturation
  billing_calendar?: string;
  // Fréquence de paiement
  payment_term?: PaymentTerm;
  // Devise de facturation différente
  different_invoicing_currency?: boolean;
  // Devise de facturation
  invoicing_currency?: string;
  // Type de taux d'échange (pour l'instant ne peut valoir que 'D')
  rate_type?: string;
  // Date du taux à utiliser : J (0) ou J-1 (-1) fin du transport
  rate_date?: number;
  // Code incoterm
  incoterm_code?: IncotermCode;
  // Information additionel de l'incoterm
  incoterm_additional_info?: string;
  // Type de distribution
  distribution_type?: DistributionType;
  // Joindre fichier SAP à la facture
  join_sap_file?: boolean;
  // Envoie du fichier en attente
  waiting_sap_file?: boolean;
  // Code article
  article_code?: TransportRoadArticleCode | ParkServiceArticleCode | TransportArticleCode | MeansRoadArticleCode;
  // Vente uniquement - Présentation de la facture dans SAP
  invoice_display_sap?: InvoiceDisplaySap;
  // Purchase only - Preinvoice display in SAP
  preinvoice_display_sap?: PreinvoiceDisplaySap;
  // Vente uniquement - texte de détail par VIN
  invoice_line_detail_sap?: InvoiceLineDetailSap;
  // Évènement déclencheur de la facturation
  invoiceable_event?: InvoiceableEvent;
  // Envoi automatique à SAP dérogatoire
  automated_sending?: AutomatedSendingType;
  // Sales Preinvoice Sending Options
  sales_preinvoice_sap_sending?: SalesPreinvoiceSendingType;
  // Envoi automatique de préfacture
  sending_supplier_preinvoice?: boolean;
  // Contacts de la préfacture
  purchase_order_contact?: IBillingContact;
  // Verification des informations de la TL avant la facturation
  check_tl_infos_before_invoicing?: CheckTlInfosType;
  // Verification des détails d'informations de la TL avant facturation
  detailed_info_before_invoicing_check?: boolean;
  // This is used indicate if we will split the documents generated by TL by initial_document_no or not.
  accepts_partial_credit_notes?: boolean;
  // This is used only to select if the contract will have more than one stockage in a single day.
  multiple_storage_on_same_day?: boolean;
  // Reference to the taxed object
  taxed_object_reference?: string;
}

interface IContractMeansRoad {
  // Versions du contrat
  versions?: Array<IContractVersionRef>;
  // Distance calculation - contract d'achat MEANS_ROAD
  distance_calculator?: string;
  // Options de taxation (prise en compte de la distance à vide avant/après)
  empty_distance_retribution: EmptyDistanceRetributionOption;
  // Calcul de distance par groupe de voyages (Mercurio - Padroncini)
  trips_distance_calculation?: boolean;
  // Approbation manuelle
  expenses_approval_required: boolean;
  // triger 2 taxation lines one for empty one for loaded
  split_empty_kilometers: boolean;
  // Liste des codes tarifs contenus dans les version
  tarif_codes?: string[];
}

export interface ISalesScheme {
  // Marché considéré pour la voiture : Véhicule neufs (VN) ou véhicules d'occasion (VO) - idem TRSP-ROAD
  vnvo_type: VehicleBusinessType;
  // Code produit, utilisé pour le rapprochement contrats
  product_code?: string[];
  // Rang / priorisation, utilisé pour le rapprochement contrats
  rank?: number;
  // Ce schéma de vente est-il éligible à la création d'ordres manuels
  manual_order?: boolean;
  // Zone de départ du contrat
  departure?: IMemberRole[];
  // Zone d'arrivé du contrat
  arrival?: IMemberRole[];
  // Versions du contrat
  versions?: IContractVersionRef[];
  vehicle_category_codes?: string[];
  origin_zones?: IContractGeoZone;
  destination_zones?: IContractGeoZone;
  start_date?: Date;
  end_date?: Date;
}

interface IContractGeoZone {
  places?: GeoPlaceReference[];
  third_parties?: Partial<IThirdParty>[];
}

export interface ISalesSchemeContractOutput {
  // Type d'origine (ORIGIN, VIA, DESTINATION, FORCED), par défaut ORIGIN
  origin_type?: ServiceLocationType;
  // Lieu d'origine en cas de FORCED : member role, sinon string
  origin?: IMemberRole;
  // Type de destination (ORIGIN, VIA, DESTINATION, FORCED), par défaut DESTINATION
  destination_type?: ServiceLocationType;
  // Lieu de destination en cas de FORCED : Member role, sinon string
  destination?: IMemberRole;
  // Numéro d'ordre / poste de facturation des services (principalement pour la comptabilisation)
  posting_code?: string;
  // Prestation ou package de prestations vendu(e) (nécessaire à la consignation / plan d'opérations)
  service?: string;
  // donneur d'ordre du service (code)
  principal_code?: string;
  // fournisseur du contrat de service
  supplier?: {
    id: string;
    code: string;
    name: string;
    x_code?: string;
  };
  // Type de contrat (TRSP-ROAD, ...)
  contract_type?: string;
  // Contrat de service
  contract?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface IContractTransportRoad {
  // indique s'il ne peut transporter que des voitures roulantes
  rolling_vehicles_only: boolean;
  // Marché considéré pour la voiture : Véhicule neufs (VN) ou véhicules d'occasion (VO)
  vnvo_type: VehicleBusinessType;
  // Commande de moyen oui/non
  mean_order: boolean;
  // Zone de départ du contrat
  departure?: IMemberRole[];
  // Zone d'arrivé du contrat
  arrival?: IMemberRole[];
  // Type de transport: TRUCK ou JOCKEY
  transport_type: TransportType;
  // Type de service Lot/Vin
  service_type: ServiceType;
  // Code produit, utilisé pour le rapprochement contrats - A SORTIR DE IVALORIZATION
  product_code?: string[];
  // Rang / priorisation, utilisé pour le rapprochement contrats - A SORTIR DE IVALORIZATION
  rank?: number;
  // Versions du contrat
  versions?: Array<IContractVersionRef>;
  // Valeur par défaut pour le départ
  default_departure?: IDefaultEndPoint;
  // Valeur par défaut pour l'arrivé
  default_arrival?: IDefaultEndPoint;
  // Default value for supplier
  default_supplier?: IDefaultSubscription;
  // Validation manuel pour l'envoi de la POD
  check_pod_manually?: boolean;
  role_restriction?: ContractRoleRestriction;
  distance_calculator?: string;
  // Date utilisée pour le calcul de tarif (true : end_date or false : start_date )
  tarif_use_end_date?: boolean;
  category?: string;
}

export interface IDefaultSubscription {
  // Default Subscriptions List
  subscriptions?: ISubscriptionMemberRole[];
}

export interface IDefaultEndPoint {
  // Liste des abonnements pour les zones par défaut
  subscriptions?: ISubscriptionMemberRole[];
  // Un RDV doit être pris
  has_appointment?: boolean;
  // Parametrage des RDV
  appointment?: {
    slot_type: SlotType;
    custom?: {
      slots: {
        start: number;
        end: number;
      }[];
    };
  };
}

export interface IPricingCriterion {
  pricing_grid?: IGrid;
  pricing_client?: IPricingClient;
  formula?: PricingFormula;
  vin_pricing?: {
    fixed_price?: number;
    km?: IKmCriterion;
    range?: IRangeCriterion;
    categories_fixed?: {
      category_code?: string;
      price: number;
    }[];
    categories_km?: {
      category_code?: string;
      km: IKmCriterion;
    }[];
    categories_range?: {
      category_code?: string;
      range: IRangeCriterion;
    }[];
  };
  trip_pricing?: {
    fixed_price?: number;
    km?: IKmCriterion;
    range?: IRangeCriterion;
    categories_fixed?: {
      nb_vehicles?: number;
      category_code?: string;
      price: number;
    }[];
    categories_km?: {
      nb_vehicles?: number;
      category_code?: string;
      km: IKmCriterion;
    }[];
    categories_range?: {
      nb_vehicles?: number;
      category_code?: string;
      range: IRangeCriterion;
    }[];
  };
  distance_pricing?: IDistancePricing;
  day_pricing?: IDayPricing;
  day_distance_pricing?: IDayDistancePricing;
  bunker_index?: IPartialBunker;
}

export interface IDistancePricing {
  distance_pricing_grid: IDistancePricingItem[];
}

interface IDistancePricingItem {
  tarif_code?: string;
  country_crossed?: {
    id: string;
    code: string;
  };
  pricing: {
    threshold: number;
    base_price: number;
    unit_price: number;
    min_price: number;
    included_bunker_unit_price?: number;
    included_bunker_base_price?: number;
    included_bunker_min_price?: number;
  };
}

export interface IDayPricing {
  tarif_code?: string;
  price_per_day: number;
  day_included_bunker_unit_price?: number;
}

export interface IDayDistancePricing {
  tarif_code?: string;
  price_per_day: number;
  price_per_distance: number;
  day_included_bunker_unit_price?: number;
  distance_included_bunker_unit_price?: number;
}

export interface IGrid extends ITracable {
  _id: string;
  file_name: string;
  lines: number;
  number_of_duplicated_lines?: number;
  origin?: IDistinctDataFromEntries;
  destination?: IDistinctDataFromEntries;
  previous_location?: IDistinctDataFromEntries;
  location?: IDistinctDataFromEntries;
  next_location?: IDistinctDataFromEntries;
  category_code?: string[];
}

export interface ITempGrid extends IGrid {
  import_status: GridImportStatus;
  saved_lines_number: number;
  lines_to_save_number: number;
  error: string;
}

interface IDistinctDataFromEntries {
  zone_codes?: string[];
  zip_codes?: string[];
}

export interface IPricingClient {
  type: PricingClientTypeEnum;
  percentage?: number;
  amount?: number;
  currency?: string;
  isDisabled: boolean;
  purchaseOrSale: string;
  price_mode_default_activity_code: boolean;
}

export enum PricingClientTypeEnum {
  DEFAULT = 'DEFAULT',
  AMOUNT = 'AMOUNT',
  PERCENTAGE = 'PERCENTAGE'
}

interface IKmCriterion {
  threshold: number;
  base_price: number;
  unit_price: number;
  min_price: number;
}

interface IRangeCriterion {
  min: number;
  max: number;
  price: number;
  distance_per_km_included_bunker_unit_price?: number;
}

interface IContractPark {
  // Marché considéré pour la voiture : Véhicule neufs (VN) ou véhicules d'occasion (VO)
  vnvo_type: VehicleBusinessType;
  // Plateformes de stockage -> tiers de type Parc, plateforme ou lieu choisi
  places?: IMemberRole[];
  // Type de service -> prendre le code article du stockage ? ZSTO- Storage ? à vérifier JMC
  service_type: ServiceType;
  // Code produit, utilisé pour le rapprochement contrats -> idem contrats schémas logistiques, à sortir de IValorization
  product_code?: string[];
  // Rang / priorisation, utilisé pour le rapprochement contrats -> idem contrats schémas logistiques, à sortir de IValorization
  rank?: number;
  // Versions du contrat
  versions?: IContractParkVersion[];
}

export interface IContractParkVersion extends ITracable {
  _id: string;
  // date debut de validité de la version
  date_start: string;
  // date fin de validité de la version
  date_end?: string;
  // critères de calcul du prix, parcourir dans l'ordre
  services_lines: IContractParkServices[];
  // délai
  time_limit: ITimeLimit;
  // début de comptage du délai
  start_event: StartEvent;
}

export interface IContractParkServices {
  formula: ServicesFormula;
  services_grid?: IParkServiceGrid;
  fixed_services?: IParkServiceOutput[];
}

export interface IParkServiceGrid {
  // code de la grille
  code: string;
  // liste des services et pricings par lieu
  entries: IParkServiceGridEntry[];
}

interface IParkServiceGridEntry {
  location?: IParkGridLocation;
  category_code?: string;
  service?: IParkServiceOutput;
}

interface IParkGridLocation {
  place_id?: string;
  zip_prefix?: string;
  country_code?: string;
  third_party?: string;
  nostra_third_party?: string;
  zone_code?: string;
}

export interface IParkServiceOutput {
  // Prestation ou package de prestations vendu(e) (nécessaire à la consignation / plan d'opérations) - dans le référentiel des services
  code?: string;
  // Prestation manuelle
  name?: IMeaning;
  // Prestation incluse (true = incluse / obligatoire, false = optionnelle)
  mandatory?: boolean;
  // code activité si différent du code activité du contrat
  activity_code?: string;
  // Prix de départ, par défaut 0
  base_price?: number;
  // Montant unitaire du service
  unit_price?: string;
  // Périodicité du service en jours : permet d'indiquer si le service est rendu plusieurs fois. Exemple : un stockage aura une récurrence quotidienne
  frequency?: number;
  // Seuil de franchise (en nombre de jours), par défaut 0
  threshold?: number;
}

interface IServiceContract {
  // Marché considéré pour la voiture : Véhicule neufs (VN) ou véhicules d'occasion (VO)
  vnvo_type: VehicleBusinessType;
  // Plateformes de stockage -> tiers de type Parc, plateforme ou lieu choisi
  places?: IMemberRole[];
  // Type de service -> prendre le code article du stockage ? ZSTO- Storage ? à vérifier JMC
  service_type: ServiceType;
  // Code produit, utilisé pour le rapprochement contrats -> idem contrats schémas logistiques, à sortir de IValorization
  product_code?: string[];
  // Rang / priorisation, utilisé pour le rapprochement contrats -> idem contrats schémas logistiques, à sortir de IValorization
  rank?: number;
  // Restriction achat/ventes
  restriction_purchase_sales?: RestrictionPurchaseSales;
  // Versions du contrat
  versions?: IContractVersionRef[];
  // Automatisation / Contrôle des work orders
  automated_or_control_work_orders?: boolean;
  // Versions de contrôle et d'automatisation des work orders
  automated_or_control_work_orders_versions?: IContractVersionRef[];
}

interface IContractTransport {
  // Code produit, utilisé pour le rapprochement contrats - A SORTIR DE IVALORIZATION
  product_code: string[];
  // Type de transport: TRUCK ou JOCKEY
  transport_type: TransportType[];
  // Zone de départ du contrat
  departure: IMemberRole[];
  // Zone d'arrivé du contrat
  arrival: IMemberRole[];
  // Type de service Lot/Vin
  service_type: ServiceType;
  // Marché considéré pour la voiture : Véhicule neufs (VN) ou véhicules d'occasion (VO)
  vnvo_type: VehicleBusinessType;
  // Rang / priorisation, utilisé pour le rapprochement contrats - A SORTIR DE IVALORIZATION
  rank: number;
  // Versions du contrat
  versions?: Array<IContractVersionRef>;
  // Date utilisée pour le calcul de tarif (true : end_date or false : start_date )
  tarif_use_end_date?: boolean;
}

// objet version propres aux contrats de type TRANSPORT
export interface IContractVersionRef {
  // Id faisant référence à la version dans la collection contractversions
  _id: string;
  // Date debut de validité de la version
  date_start: string;
  // Date fin de validité de la version
  date_end?: string;
}

export interface ITimeLimit {
  type?: TimeLimitType;
  value?: number;
}

export interface IDefaultEndPoint {
  // Liste des abonnements pour les zones par défaut
  subscriptions?: ISubscriptionMemberRole[];
  // Un RDV doit être pris
  has_appointment?: boolean;
  // Parametrage des RDV
  appointment?: {
    slot_type: SlotType;
    custom?: {
      slots: {
        start: number;
        end: number;
      }[];
    };
  };
}

export interface ISupplierPricing {
  contract: {
    _id: string;
    name: string;
  };
  type: PricingClientTypeEnum;
  percentage?: number;
  amount?: number;
  currency?: string;
}

export interface IPartialBunker {
  _id: string;
  code: string;
}
