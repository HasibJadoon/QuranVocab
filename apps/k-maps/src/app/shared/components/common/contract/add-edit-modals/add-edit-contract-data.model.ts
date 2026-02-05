import { ContractType } from '../contract.domain';
import { DispatcherApiRoutesEnum } from '@lib-shared/common/contract/dispatcher-api-routes.domain';
import { AccountingAppContext } from '../../../../../../accounting/src/app/business/models/accounting-app-selection.model';

export interface IAddEditContractData {
  isEditForm: boolean;
  id?: string;
  purchaseOrSale: string;
  type: ContractType;
  isDisabled: boolean;
  currentThirdParty?: AccountingAppContext;
  apiRoute?: DispatcherApiRoutesEnum;
}
