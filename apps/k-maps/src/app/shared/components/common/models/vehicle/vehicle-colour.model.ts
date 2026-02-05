/**
 * Référentiel des couleurs
 */
import { ITranscoding } from '../transcoding.model';

export interface IVehicleColour {
  // id
  _id: string;
  // Code couleur
  colour_code: string;
  // Libellé de la couleur
  meaning: string;
  // Transcodage des couleurs
  transcoding?: ITranscoding[];
}
