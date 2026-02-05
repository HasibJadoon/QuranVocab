import { ITracable } from 'projects/lib-shared/src/lib/common/models/types.model';

export interface ICodification extends ITracable {
  _id: string;
  code: string;
  associated_codification_code?: string;
  meaning: string;
  check_vehicle: boolean;
  check_third_party: boolean;
  check_country: boolean;
  check_contract: boolean;
  check_portal: boolean;
}
