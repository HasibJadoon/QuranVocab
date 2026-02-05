/**
 * Role d'un tiers
 */
export enum ThirdPartyRole {
  // Donneur d'ordre
  PRINCIPAL = 'PRINCIPAL',

  // Facturé
  BILLED = 'BILLED',

  // Client
  CUSTOMER = 'CUSTOMER',

  // Enlevement
  PICKUP = 'PICKUP',

  // Livraison
  DELIVERY = 'DELIVERY',

  // Fournisseur
  CARRIER = 'CARRIER',

  // Affretteur
  CHARTER = 'CHARTER',

  // OB_TPOP : tiers Nostra
  OBTPOP = 'OBTPOP',

  // OBPLATFORM : plateformes Nostra
  OBPLATFORM = 'OBPLATFORM',

  // OBCENTER : Agences Nostra
  OBCENTER = 'OBCENTER',

  // manager de flotte
  MRE = 'MRE',

  // role FVL
  FVL = 'FVL',

  // Dispatcher atelier
  WORKSHOP_DISPATCHER = 'WORKSHOP_DISPATCHER',

  // Fournisseur atelier
  WORKSHOP_SUPPLIER = 'WORKSHOP_SUPPLIER',

  // Loueur
  NETWORK = 'NETWORK',

  // Agent de Platforme
  PARK = 'PARK',

  // Platforme
  PLATFORM = 'PLATFORM',

  // Comptable
  LEGAL_ENTITY = 'LEGAL_ENTITY',

  // AGENCE
  BRANCH = 'BRANCH',

  // Compte de stock
  STOCK_ACCOUNT = 'STOCK_ACCOUNT',

  // Compte de stock
  PRODUCTION_SITE = 'PRODUCTION_SITE'
}

export const THIRD_PARTY_ROLES = Object.keys(ThirdPartyRole).map((k) => ThirdPartyRole[k]);
