import { Device } from '@awesome-cordova-plugins/device/ngx';
import { User } from '../../../../../driver/src/app/business/models/user.model';

export interface IDebugInfo {
  date_utc: string;
  username: string;
  app: string;
  error_status: number;
  error_message: string;
  url: string;
  details: {
    user: User;
    request: any;
    error: any;
    mobile: Device | false;
  };
}
