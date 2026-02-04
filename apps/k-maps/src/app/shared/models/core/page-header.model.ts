import { Params } from '@angular/router';

export interface PageHeaderTabItem {
  id: string;
  label?: string;
  iconUrl?: string;
  commands: any[];
  queryParams?: Params;
}

export interface PageHeaderActionItem {
  label: string;
  commands: any[];
  queryParams?: Params;
}

export interface PageHeaderTabsConfig {
  tabs: PageHeaderTabItem[];
  activeTabId: string;
  action?: PageHeaderActionItem;
}

export interface PageHeaderSearchAction {
  label: string;
  commands?: any[];
  queryParams?: Params;
}

export interface PageHeaderSearchConfig {
  placeholder: string;
  queryParamKey?: string;
  primaryAction?: PageHeaderSearchAction;
  secondaryAction?: PageHeaderSearchAction;
  tertiaryAction?: PageHeaderSearchAction;
}
