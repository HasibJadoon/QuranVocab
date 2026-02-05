import * as lodash from 'lodash';

export type FacetModel = any;

export interface ICategoriesModel {
  [id: string]: FacetModel;
}

export interface IFacetModel {
  categories?: ICategoriesModel;
}

export interface ICategoryLineModel {
  _id: any;
  count: number;
}

export interface IFacetDataModel {
  [key: string]: ICategoryLineModel[];
}

export interface IHistoryModel {
  id: string;
  value: IFacetModel;
  created_date: Date;
}

export interface IFavoriteModel {
  name: string;
  value: IFacetModel;
  created_date: Date;
}

export enum CategoryVisibility {
  OPEN = 'open',
  CLOSE = 'close'
}

export interface ICategorySettingsModel {
  visibility?: CategoryVisibility;
}

export interface ICategoriesSettingsModel {
  [id: string]: ICategorySettingsModel;
}

export interface ISettingsModel {
  saveDisplayMode?: 'auto' | 'dropdown' | 'modal';
  categories?: ICategoriesSettingsModel;
  positions?: string[];
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
