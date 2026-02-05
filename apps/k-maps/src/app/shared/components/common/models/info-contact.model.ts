export interface IInfoContact {
  // Nom prénom
  name: string;
  // Téléphone
  phone?: string;
  // Email
  email?: string;
  // La langue pour dialoguer avec lui
  language?: string;
  role?: string;
}

export interface IInfoDetailedContact extends IInfoContact {
  fax?: string;
  telex?: string;
}
