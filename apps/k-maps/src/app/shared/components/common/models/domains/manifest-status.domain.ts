/**
 * Status de la commande de transport route
 */
export enum ManifestStatus {
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
  DIP = 'DIP',
  // Manifest executed
  EXE = 'EXE'
}

export const MANIFEST_STATUSS = Object.keys(ManifestStatus).map((k) => ManifestStatus[k]);
