import { RequestOrigin } from './request-origin.domain';
import { IAttachment } from './attachments.model';

export interface ILocalDate extends ITracable {
  // Date local
  date: string;
  // Date en version utc, calculer selon la timezone du lieu où se passe l'événement
  utc_date?: string | Date;
  // Date local en jsdate, attention la timezone est Z mais la date est la même que la local
  js_date?: string | Date;
  // position au moment de la prise de date
  position?: IGeoposition;
  // distance entre la position de la date et l'étape pickup/delivery (en m)
  distance_from_endpoint?: number;
}

/**
 * Interface utilitaire pour tracé les modifications des objects
 */
export interface ITracable {
  // Créer par
  created_by?: string;
  // Date de création
  created_date?: Date;
  // application dont provient la requete de création
  created_from?: RequestOrigin;
  // Mis à jour par
  updated_by?: string;
  // Date de mise à jour
  updated_date?: Date;
}

export interface IUsable {
  // Créer par
  last_use_by?: string;
  // Date de création
  last_use_date?: Date;
}

export interface IDocumentLink extends IAttachment {
  _id?: string;
}

export class IMeaning {
  [key: string]: string;
}

export interface IGeoposition {
  latitude: number;
  longitude: number;
  geo?: {
    type: 'Point';
    // [longitude, latitude]
    coordinates: number[];
  };
}

export interface IGeometryCollection {
  type: 'GeometryCollection';
  geometries: {
    type: 'Polygon';
    // [ [ [longitude, latitude] ] ]
    coordinates: number[][][];
  }[];
}

/**
 * Transition de changement de status
 */
export interface ITransition<E> {
  // status de la transition
  status: E;
  // date de changement de la transition
  changed_date: Date;
  // username du changement de la transition
  changed_by: string;
}

export interface IRate {
  name?: string;
  comment?: string;
  note: number;
  created_date: Date;
  updated_date: Date;
}

export interface ITaxationThirdParty {
  third_party_id: string;
  code: string;
  name: string;
}
