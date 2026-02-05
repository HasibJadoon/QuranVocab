import { IGeoposition, ILocalDate } from '../../../../../lib-shared/src/lib/common/models/types.model';

/**
 * Position da ressource transportant l'ordre
 */
export interface ITracking {
  _id: string;
  order_id?: string; // Si tracking du rto, sinon undefined
  trip_id?: string; // Si tracking du trip, sinon undefined
  datetime: ILocalDate;
  position: IDetailedGeoposition;
}

export interface IDetailedGeoposition extends IGeoposition {
  accuracy?: number;
  altitude?: number;
  altitude_accuracy?: number;
  heading?: number;
  speed?: number;
}

export interface IDatedDetailedGeoPosition extends IDetailedGeoposition {
  datetime: ILocalDate;
}
