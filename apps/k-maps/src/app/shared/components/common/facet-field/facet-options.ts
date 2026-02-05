import { Observable } from 'rxjs/internal/Observable';
import { ElementRef } from '@angular/core';
import { Params } from '@angular/router';
import { FacetModel, ICategoryLineModel } from './facet-model';

export interface ILineActionConfig {
  nameKey?: string;
  params?: (item: ICategoryLineModel, key: string) => object;
  icon?: string | ((item: ICategoryLineModel, key: string) => string);
  cssClass?: string | ((item: ICategoryLineModel, key: string) => string);
  disabled?: (item: ICategoryLineModel, key: string) => boolean;
  hidden?: (item: ICategoryLineModel, key: string) => boolean;
  action?: (item: ICategoryLineModel, key: string, button: ElementRef | HTMLElement) => void;
  routerLink?: (item: ICategoryLineModel, key: string) => any[] | string;
  routerQueryParam?: (item: ICategoryLineModel, key: string) => Params;
  routerState?: (
    item: ICategoryLineModel,
    key: string
  ) => {
    [k: string]: any;
  };
  disableTooltip?: boolean;
}

export enum StandardCategorySubType {
  TEXT = 'text',
  LISTDICO = 'listdico',
  ASYNC = 'async'
}

export interface IStandardCategory {
  sub_type: StandardCategorySubType;
  text?: {
    transform?: (item: ICategoryLineModel, key: string) => string;
  };
  listdico?: {
    prefixKey: string;
    forceUpperCase?: boolean;
  };
  async?: {
    value: (item: ICategoryLineModel, key: string) => Observable<string>;
  };
  // Nombre d'élément par défaut
  maxLines?: number;
  // Désactive la recherche
  disableSearch?: boolean;
  // Action sur la ligne
  lineAction?: ILineActionConfig;
  // Aller à la ligne
  textBreak?: boolean;
}

export interface IBucketCategory {
  boundaries: { value: any; min: any; max?: any; name?: string }[];
  showOnlyWithCount?: boolean;
}

export interface IBucketAutoCategory {}

export interface IGeoDistanceCategory {
  boundaries: { value: any; min: any; max?: any }[];
  shouldAutoCheck?: boolean;
  showOnlyWithCount?: boolean;
}

export interface IDaysSinceCategory {
  boundaries: { value: any; min?: any; max?: any }[];
  showOnlyWithCount?: boolean;
}

/**
 * Type de categorie
 */
export enum CategoryType {
  STANDARD = 'standard',
  BUCKET = 'bucket',
  BUCKET_AUTO = 'bucketAuto',
  GEO_DISTANCE = 'geoDistance',
  DAYS_SINCE = 'daysSince'
}

/**
 * Options de la sauvegarde
 */
export interface ISaveOptions {
  // Id unique de la sauvegarde
  id: string;
  // Active l'historisation des recherches
  history?: boolean;
  // Active la sauvegarde des favoris
  favorite?: boolean;
  // Mode d'affichage de la sauvegarde, défaut 'auto'
  showMode?: 'auto' | 'dropdown' | 'modal';
}

interface ICategoryConfigBase {
  // Type de categorie
  type: CategoryType;
  // Nom de la categorie
  nameKey: string;
  // Fermé par défaut
  defaultClose?: boolean;
  // Désactive le filtre
  disable?: boolean | Observable<boolean>;
  // Mode de sélection, défaut multi
  selection?: 'single' | 'multi';
  // Si la valeur sélectionnée est égale à l'autre valeur
  isSelected?: (value: FacetModel, other: FacetModel) => boolean;
}

export interface ICategoryStandardConfig extends ICategoryConfigBase {
  type: CategoryType.STANDARD;
  standard?: IStandardCategory;
}

export interface ICategoryBucketConfig extends ICategoryConfigBase {
  type: CategoryType.BUCKET;
  bucket: IBucketCategory;
}

export interface ICategoryGeoDistanceConfig extends ICategoryConfigBase {
  type: CategoryType.GEO_DISTANCE;
  geoDistance: IGeoDistanceCategory;
}

export interface ICategoryBucketAutoConfig extends ICategoryConfigBase {
  type: CategoryType.BUCKET_AUTO;
  bucketAuto: IBucketAutoCategory;
}

export interface ICategoryDaysSinceConfig extends ICategoryConfigBase {
  type: CategoryType.DAYS_SINCE;
  daysSince: IDaysSinceCategory;
}

/**
 * Description d'une categorie
 */
export type ICategoryConfig = ICategoryStandardConfig | ICategoryBucketConfig | ICategoryGeoDistanceConfig | ICategoryBucketAutoConfig | ICategoryDaysSinceConfig;

/**
 * Configuration des categories
 */
export interface ICategoriesConfig {
  [id: string]: ICategoryConfig;
}

/**
 * Options des categories
 */
export interface ICategoriesOptions {
  mode?: 'auto' | 'button' | 'panel';
  mobileWidth?: number;
  size?: 'normal' | 'sm';
  // Liste des categories
  categoriesConfig?: ICategoriesConfig;
}

/**
 * Option des facets
 */
export interface IFacetOptions {
  // Options de la sauvegarde
  save?: ISaveOptions;
  // Options des categories
  categories?: ICategoriesOptions;
}
