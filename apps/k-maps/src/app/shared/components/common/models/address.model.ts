import { ITracable } from '@lib-shared/common/models/types.model';

export enum AddressRole {
  // Donneur d'ordre
  PRINCIPAL = 'PRINCIPAL',
  // Facturé
  BILLED = 'BILLED',
  // Client
  CUSTOMER = 'CUSTOMER',
  // Enlèvement
  PICKUP = 'PICKUP',
  // Livraison
  DELIVERY = 'DELIVERY'
}

export interface IAddress extends ITracable {
  _id?: string;
  // Roles de cette adresse
  roles: AddressRole[];
  // Nom de l'adresse
  name: string;
  // Identifiant de google place
  place_id: string;
  // Place name
  place_name: string;
  // Adresse
  address1: string;
  address2?: string;
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
  // Contact
  contact: {
    name?: string;
    phone?: string;
    email?: string;
    language?: string;
  };
}
