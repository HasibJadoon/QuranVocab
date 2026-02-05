/**
 * Status de la commande de transport route
 */
export enum OperationalResourceStatus {
  // EMP - Vide, sans affectation
  EMP = 'EMP',
  // EMA - Vide, avec affectation
  EMA = 'EMA',
  // OWP - En route vers l'enlèvement
  OWP = 'OWP',
  // OSP - Sur le site d'enlèvement
  OSP = 'OSP',
  // PIP - En cours de chargement
  PIP = 'PIP',
  // OWD - En route vers la livraison
  OWD = 'OWD',
  // OSD - Sur le site de livraison
  OSD = 'OSD',
  // DIP - En cours de déchargement
  DIP = 'DIP'
}

export const OPERATIONAL_STATUSS = Object.keys(OperationalResourceStatus).map((k) => OperationalResourceStatus[k]);
