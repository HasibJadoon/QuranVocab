import { ITrip } from '@lib-shared/common/models/trip.model';
import { IValuationTrspRoad } from './valuate.model';

export interface IContractsFoundedByRound {
  t1?: IValuationTrspRoad[];
  t2?: IValuationTrspRoad[];
  sameRankError?: string[];
}

export interface IValuateResultTrip {
  oldTrip: Partial<ITrip>;
  trip: Partial<ITrip>;
  valuationTrspRoad?: IValuationTrspRoad;
  contracts?: IContractsFoundedByRound;
}

export interface ISingleTripValorizationReport {
  report?: {
    ok?: string;
    ko?: {
      trip: string;
      charter_id: string;
      errMsg: string;
    };
  };
  reponse?: IValuateResultTrip;
}
