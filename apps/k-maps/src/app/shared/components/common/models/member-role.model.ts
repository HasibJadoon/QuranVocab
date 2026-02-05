import { IBillingContact, ILegalEntity } from '@lib-shared/common/third-party/third-party.model';
import { SubscriptionMode } from '@lib-shared/common/models/subscription-mode';
import { ITranscoding } from '@lib-shared/common/models/transcoding.model';
import { IInfoContact, IInfoDetailedContact } from '@lib-shared/common/models/info-contact.model';
import { IGeometryCollection, IGeoposition } from '@lib-shared/common/models/types.model';
import { SubscriptionLevel } from '@lib-shared/common/models/subscription-level';

/**
 * Interface d'un membre externe, donneur d'ordre, enlèvement, livraison etc
 */
export interface IMemberRole {
  // Id Tiers si le member role est la copie d'un tiers
  third_party_id?: string;
  // Code gefco
  gefco_code?: string;
  // Code du tiers
  code?: string;
  // Codification du tiers (pointe sur le référentiel des codifications)
  codification?: string;
  // Code externe du tiers
  x_code?: string;
  // Nom du membre role
  name?: string;
  // Nom 2 du membre role
  name2?: string;
  // place id google
  place_id?: string;
  // place name google
  place_name?: string;
  // Adresse
  address1?: string;
  address2?: string;
  address3?: string;
  // Code postal
  zip?: string;
  // Ville
  city?: string;
  // State
  state?: string;
  // Pays
  country?: {
    // Code pays
    code?: string;
    // Nom pays dans la langue du pays
    name?: string;
  };
  // Timezone du lieu ex : Europe/Paris
  timezone?: string;
  // Géoposition
  geoposition?: IGeoposition;
  // Aire en polygones
  area?: IGeometryCollection;
  // Contact principale du member role
  contact?: {
    // Nom prénom
    name: string;
    // Téléphone
    phone?: string;
    // Email
    email?: string;
    // La langue pour dialoguer avec lui
    language?: string;
    fax?: string;
    telex?: string;
  };
  // Référence de la commande pour ce role
  x_reference?: string;
  subscriptions?: ISubscriptionMemberRole[];
  transcoding?: ITranscoding[];
  // conteneur de champs obtpop issus du thirdparty gefco
  obtpop?: {
    tpop_id?: string;
    center_id?: string;
  };
  // Contexte d'une plateforme de stockage
  park?: {
    // Contacts du tiers
    contacts?: Array<IInfoContact>;
    // Capacité de stockage
    capacity?: number;
    // Référence vers le tiers
    platform_agent?: {
      platform_agent_id: string;
      platform_agent_code: string;
    };
    // Système utilisé par le tiers
    ext_system?: string;
    automated_gate?: boolean;
    check_road?: boolean;
    check_rail?: boolean;
    check_sea?: boolean;
    short_meaning?: string;
  };
  // Contexte d'une agence
  branch?: {
    // Code agence
    code: string;
  };
  // Code de l'agence relié à ce member role
  agency?: string;
  // Contexte d'un compte de stock
  stock_account?: {
    // Référence vers le tiers qui stock
    platform: {
      _id: string;
      name: string;
    };
    // Référence vers le tiers donneur d'ordre
    principal?: {
      _id: string;
      name: string;
    };
  };
  //  conteneur de champs obplatform issus du thirdparty gefco
  obplatform?: {
    platform_id?: string;
  };
  //  conteneur de champs obcenter issus du thirdparty gefco
  obcenter?: {
    center_id?: string;
  };
  // Member role dérogatoire
  check_derogatory_main_infos?: boolean;
  // Contact de facturation
  billing_contact?: IBillingContact;
  associated_legal_entity_id?: string;

  // Associated legal entity
  associated_legal_entity?: IAssociatedLegalEntity;

  // Legal entity
  legal_entity?: ILegalEntity;

  // est-ce que l'adresse du member_role a été surchargé
  check_overloaded_address?: boolean;
}

export interface IAssociatedLegalEntity {
  _id: string;
  name: string;
}

export interface ISubscriptionMemberRole {
  // Type de l'evenement
  event_type: string;
  // Mode d'abonnement
  mode: SubscriptionMode;
  // Entities levels
  level?: SubscriptionLevel;
  // Utilise le contact du member role
  use_member_role_contact?: boolean;
  // Liste des contacts abonnée
  contacts?: IInfoDetailedContact[];
  // Context
  context?: object;
  // Tags
  tags?: string[];
  // Template id
  template_id?: string;
}

export interface IQueryFindPlaceDetail {
  third_party_id?: string;
  latitude?: number;
  longitude?: number;
  place_id?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  zip?: string;
  city?: string;
  country_name?: string;
  force_recalcul_with_address_keys?: boolean;
}
