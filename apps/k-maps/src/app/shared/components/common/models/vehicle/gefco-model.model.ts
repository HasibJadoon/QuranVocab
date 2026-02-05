import { ITranscoding } from '../transcoding.model';

export interface IMaker {
  _id?: string;
  code: string;
  name: string;
  // Codification (pointe sur le référentiel des codifications, je mets juste string mais bon)
  codification_id?: string;
  // Code externe
  x_code?: string;
}

export interface IModel {
  _id?: string;
  code: string;
  name: string;
  // Codification (pointe sur le référentiel des codifications, je mets juste string mais bon)
  codification_id?: string;
  // Code externe
  x_code?: string;
  // Silhouete
  shape?: IShape;
}

export interface IShape {
  _id?: string;
  code: string;
  name: string;
  // Codification (pointe sur le référentiel des codifications, je mets juste string mais bon)
  codification_id?: string;
  // Code externe
  x_code?: string;
}

export interface IGefcoModel {
  _id?: string;
  // Model_ID issu de NOSTRA (ex : 020C2CM5ELEFL1H1)
  model_code: string;
  // Libellé du model_id (ex : BERLINGO (M5) ELECTRI FRG.COURT H1)
  meaning: string;
  // codification
  codification: string;
  // x_code
  x_code: string;
  // Genre (FR) / Type (EN)
  type?: {
    // Code (ex : 02)
    code: string;
    // Libellé : jointure avec la table OB_VEH_TYPE (ex : PETITS ET MOYENS UTILITAIRES)
    meaning?: string;
  };
  // Marque (FR) / Make (EN)
  make?: {
    // Code (ex : C)
    code: string;
    // Libellé : jointure avec la table OB_VEH_MAKE (ex : CITROEN)
    meaning?: string;
    // x_code
    x_code?: string;
  };
  // Ligne de produit (FR) / Article (EN)
  article?: {
    // Code (ex : 2CM5)
    code: string;
    // Libellé : jointure avec la table OB_VEH_ARTICLE (ex : BERLINGO VU (M5))
    meaning?: string;
  };
  // Silhouette (FR) / Line (EN)
  line?: {
    // Code (ex : FL1H1)
    code: string;
    // Libellé : jointure avec la table OB_VEH_LINE (ex : FRG.EMP.COURT H1)
    meaning?: string;
  };
  // Moteur (FR) / Engine (EN)
  engine?: {
    // Code (ex : ELEC)
    code: string;
    // Libellé : jointure avec la table OB_VEH_ENGINE (ex : ELECTRIQUE)
    meaning?: string;
    // Code externe
    x_code?: string;
  };
  // Transmission (FR) / Transmission (EN)
  transmission?: {
    // Code (ex : SANS)
    code: string;
    // Libellé : jointure avec la table OB_VEH_TRANSMISSION (ex : SANS BV)
    meaning?: string;
  };
  // Couleur du véhicule
  colour?: {
    // Code
    code: string;
    // Libellé : jointure avec la table OB_VEH_COLOUR
    meaning?: string;
  };
  // Longueur (FR) / Length (EN) (donnée en mètre)
  length?: number;
  // Largeur (FR) / Width (EN) (donnée en mètre)
  width?: number;
  // Poids (FR) / Weight (EN) (donnée en kilogramme)
  weight?: number;
  // Largeur des flans (FR) / Width side (EN) (donnée en mètre)
  width_side?: number;
  // Hauteur hors tout minimum (FR) / Height min (EN) (donnée en mètre)
  height_min?: number;
  // Hauteur hors tout maximum (FR) / Height max (EN) (donnée en mètre)
  height_max?: number;
  // Code véhicule projet (FR) / Code pro (EN)
  cod_pro?: string;
  // Type de marchandise
  commodity_id?: string;
  // Type de carburant (FR) / Fuel quality (EN)
  fuel_quality?: string;
  // Quantité d’huile moteur
  engine_oil_quantity?: number;
  // Quantité d’huile transmission
  transmission_oil_quantity?: number;
  // Quantité d’huile fourche et amortisseur
  fork_oil_quantity?: number;
  // Quantité d’huile direction assistée
  power_steering_oil_quantity?: number;
  // Unité de mesure des quantités d’huile
  oil_unit?: string;
  // Quantité de fuel (FR) / Fuel quantity (EN)
  fuel_quantity?: number;
  // Cylindrée
  cylinder?: number;
  // Capacité énergétique (FR) / Energy capacity (EN)
  energy_capacity?: string;
  // Priorité
  priority?: number;
  // Rapprochement avec la modélisation Moveecar des véhicules (Maker ; Model ; Shape)
  moveecar_vehicle?: {
    make?: IMaker;
    // Modèle
    model?: IModel;
  };
  // Transcodage (ensemble des codifications + x_code de la table OB_VEH_MODEL_LINK + algo PSA)
  transcoding?: ITranscoding[];
}
