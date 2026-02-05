import { IPricing } from '@lib-shared/common/models/pricing.model';
import { IContract } from '@lib-shared/common/contract/contract.model';
import { ICfOrOpeOrWoValorizationReport } from '@lib-shared/common/models/valuate.model';
import { IMemberRole } from 'projects/fvl/src/app/shared/components/member-role-field/models';

export interface IWorkOrderContractResult {
  posting_code: string;
  owned: IMemberRole;
  billed_customer?: IMemberRole;
  supplier?: IMemberRole;
  product_code?: string;
  customer_codification?: {
    entity: string;
    value: string;
  };
  pricing: IPricing;
  contract_id?: string;
  contractsFound: IContract[];
}

interface PilotingResponseCustomerFile {
  work_orders: { work_order_no: string }[];
}

export interface IPilotingWorkOrderSearchResponse {
  response: {
    workOrderSalesContract?: IWorkOrderContractResult;
    workOrderPurchaseContracts?: IWorkOrderContractResult;
    vehicleLife?: {
      _id: string;
      customer_files: PilotingResponseCustomerFile;
    };
  };
  debugReport: ICfOrOpeOrWoValorizationReport;
}
