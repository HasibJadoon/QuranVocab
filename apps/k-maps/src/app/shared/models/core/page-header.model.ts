import { Params } from '@angular/router';

export interface PageHeaderTabItem {
  id: string;
  label?: string;
  iconUrl?: string;
  commands: any[];
  queryParams?: Params;
  disabled?: boolean;
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

export interface PageHeaderFilterOption {
  value: string;
  label: string;
}

export interface PageHeaderFilterConfig {
  id: string;
  queryParamKey: string;
  value: string;
  options: PageHeaderFilterOption[];
  resetPageOnChange?: boolean;
}

export interface PageHeaderFilterChangeEvent {
  id: string;
  queryParamKey: string;
  value: string;
  resetPageOnChange?: boolean;
}

export interface PageHeaderSearchConfig {
  placeholder: string;
  queryParamKey?: string;
  primaryAction?: PageHeaderSearchAction;
  secondaryAction?: PageHeaderSearchAction;
  tertiaryAction?: PageHeaderSearchAction;
  filters?: PageHeaderFilterConfig[];
}

export interface PageHeaderPaginationConfig {
  page: number;
  pageSize: number;
  total: number;
  hideIfSinglePage?: boolean;
  pageSizeOptions?: number[];
}
