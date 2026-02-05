import { IContract } from '@lib-shared/common/contract/contract.model';
import { IPricings } from '@lib-shared/common/models/pricing.model';
import { IService } from '@lib-shared/common/models/service.model';
import { CustomerFileValorizationActionsEnum } from '@lib-shared/common/piloting/valorization-actions.domain';

export interface IValuationTrspRoad {
  contract: IContract;
  pricings: IPricings;
  services?: IService[];
  pricingsDebug?: IValuationTrspRoad[];
}

export interface IToValorizationReport {
  ok: string;
  ko: {
    to: string;
    charter_id: string;
    errMsg: string;
  };
  executionId?: string;
}

export interface ITripValorizationReport {
  ok?: string;
  ko?: {
    trip: string;
    charter_id: string;
    errMsg: string;
  };
}

export interface ICfOrOpeOrWoValorizationReport {
  ok: {
    no: string;
    warnMsg?: string;
  };
  ko: {
    no: string;
    errMsg: string;
  };
  executionId?: string;
}

export interface RelaunchValorizationReport {
  ok: Array<{
    action: CustomerFileValorizationActionsEnum;
    main_object_no: string;
    vehicle_life_no: string;
    customer_file_no: string;
  }>;
  ko: Array<{
    main_object_no?: string;
    action?: CustomerFileValorizationActionsEnum;
    vehicle_life_id?: string;
    customer_file_id?: string;
    service_or_transport_contract_id?: string;
    errorMessage?: string;
  }>;
  executionId?: string;
  executionIds?: string[];
}
