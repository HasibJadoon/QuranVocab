import { FilterVisibility } from './search-options';
import * as lodash from 'lodash';

export interface INumberFilterModel {
  min: {
    operator: 'gte' | 'gt';
    value: number;
  };
  max: {
    operator: 'lte' | 'lt';
    value: number;
  };
}

export interface ISimpleNumberFilterModel {
  value: number;
}

export interface IDateFilterModel {
  mode:
    | 'range'
    | 'rangeWithTime'
    | 'today'
    | 'todayBefore'
    | 'todayAfter'
    | 'todayYesterday'
    | 'yesterday'
    | 'yesterdayBefore'
    | 'tomorrow'
    | 'tomorrowAfter'
    | 'currentWeek'
    | 'currentMonth'
    | 'lastWeek'
    | 'lastMonth'
    | 'lastCurrentMonth'
    | 'filled'
    | 'empty';
  min: {
    value: string;
    time?: string;
  };
  max: {
    value: string;
    time?: string;
  };
}

export interface ISimpleDateFilterModel {
  date: {
    value: string;
  };
}

export interface IAutocompleteFilterModel {
  id: string;
  name: string;
  excluded: boolean;
  empty: boolean;
}

export interface IAsyncSelectFilterModel {
  id: string;
  name: string;
}

export interface IFiltersModel {
  [id: string]: string | INumberFilterModel | IDateFilterModel | IAutocompleteFilterModel | IAsyncSelectFilterModel | any;
}

export interface ISearchTagModel {
  value: any;
  nameKey?: string;
  display?: string;
  secondaries?: Array<ISearchTagModel>;
  readonly?: boolean;
  restrictions?: any;
  projection?: Array<string>;
  compute?: any;
}

export interface ISearchModel {
  text: string;
  tags?: Array<ISearchTagModel>;
  filters?: IFiltersModel;
  sort?: string;
  primaryPreferred?: boolean;
  currentFavoriteName?: string;
}

export interface IHistoryModel {
  id: string;
  value: ISearchModel;
  created_date: Date;
}

export interface IFavoriteModel {
  name: string;
  value: ISearchModel;
  created_date: Date;
}

export interface IFilterSettingsModel {
  visibility?: FilterVisibility;
  defaultValue?: any;
}

export interface IFiltersSettingsModel {
  [id: string]: IFilterSettingsModel;
}

export interface ISettingsModel {
  filtersDisplayMode?: 'auto' | 'dropdown' | 'modal' | 'inline';
  saveDisplayMode?: 'auto' | 'dropdown' | 'modal';
  filters?: IFiltersSettingsModel;
}

export const $FILTER_KIND$ = '$FILTER_KIND$';

export enum FilterValueKind {
  SET = '$SET$',
  UNSET = '$UNSET$',
  FILTERED = '$FILTERED$'
}

export function unmarshalFavorite(src: any): any {
  if (lodash.isArray(src)) {
    return src.map((elem) => unmarshalFavorite(elem));
  } else if (lodash.isObject(src)) {
    return Object.keys(src).reduce<any>((acc, key) => {
      const unmarshalledKey = key.startsWith('_$_') ? key.replace('_$_', '$') : key;
      const value = src[key];
      acc[unmarshalledKey] = unmarshalFavorite(value);
      return acc;
    }, {});
  }
  return src;
}

export function marshalFavorite(src: any): any {
  if (lodash.isArray(src)) {
    return src.map((elem) => marshalFavorite(elem));
  } else if (lodash.isObject(src)) {
    return Object.keys(src).reduce<any>((acc, key) => {
      const marshalledKey = key.startsWith('$') ? key.replace('$', '_$_') : key;
      const value = src[key];
      acc[marshalledKey] = marshalFavorite(value);
      return acc;
    }, {});
  }
  return src;
}
