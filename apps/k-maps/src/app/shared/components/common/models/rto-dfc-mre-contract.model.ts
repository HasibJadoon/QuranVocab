export interface IRtoDfcMreContract {
  // id contrat
  contract_id?: string;
  // code contrat, par défaut ''
  code: string;
  // nom du contrat, par défaut ''
  name: string;
  // nom du forunisseur, par défaut ''
  provider_name: string;
  // devise de la version, par défaut €
  currency: string;
  // code du tarif, défini dans la ressource, par défaut ''
  pricing_code: string;
}
