import { McitMenuItem } from '../layouts/menu.service';
import { McitTabMenuItem } from '../layouts/tab-menu.service';

export class McitCoreEnv {
  production: boolean;
  apiUrl: string;
  useCookie: boolean;
  cordova: boolean;
  appVersion?: string;
  disableChat?: boolean;
}

export class McitCoreConfig {
  app: string;
  defaultRouteUrl: string;
  ignoreUrls: string[];
  defaultMenus: McitMenuItem[];
  useTabMenu: boolean;
  defaultTabMenus: McitTabMenuItem[];
  defaultSettings: { [key: string]: any };
}
