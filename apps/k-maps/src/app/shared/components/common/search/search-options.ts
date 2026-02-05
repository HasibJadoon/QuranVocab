import { Observable } from 'rxjs';
import { ComponentType } from '@angular/cdk/portal';
import { ControlValueAccessor } from '@angular/forms';
import { ISearchTagModel } from './search-model';

export interface IListItem {
  code: string;
  nameKey?: string;
  unSelectAll?: boolean;
  ignoreTranslate?: boolean;
  params?: any;
  disabled?: boolean;
}

export interface ISelectListFilter {
  values: IListItem[];
  emptyNameKey?: string;
}

export interface IAsyncSelectListFilter {
  values: Observable<{ id: string; name: string }[]>;
  emptyNameKey?: string;
}

export interface IRadioListFilter {
  values: IListItem[];
  emptyNameKey?: string;
}

export type CheckListFilterResultType = 'array' | 'string';

export interface ICheckListFilter {
  values: IListItem[];
  result: CheckListFilterResultType;
}

export interface IAsyncCheckListFilter {
  values: Observable<{ id: string; name: string }[]>;
  result: CheckListFilterResultType;
}

export interface ITextFilter {
  min?: number;
  max?: number;
  encoding?: TextFilterEncoding;
}

export interface INumberFilter {
  min?: number;
  max?: number;
  simple?: number;
}

export type DateFilterResultType = 'local' | 'utc';

export interface IDateFilter {
  includeMin?: boolean;
  includeMax?: boolean;
  result?: DateFilterResultType;
}

export interface IAutocompleteFilter {
  search: (query) => Observable<{ id: string; name: string; description?: string; descriptionAdditional?: string; icon?: string; iconPlaceholder?: string }[]>;
  placeholder?: string;
  iconClass?: string;
}

export interface ICustomFilter {
  toString: (value: any, config: IFilterConfig) => string;
  componentType: ComponentType<ControlValueAccessor>;
  data?: any;
  query: {
    toString: (value: any) => string;
    fromString: (value: string) => any;
  };
}

export interface ITagsFilter {
  result: 'array' | 'string';
  stringFormat?: (value: string) => string;
  isNotTag?: boolean;
}

export interface IStringListFilter {
  objectKey?: string;
  result: 'array' | 'string';
}

/**
 * Type de filtre
 */
export enum FilterType {
  RADIO_LIST = 'radioList',
  REDUCED_DATE = 'reduceDate',
  SIMPLE_DATE = 'simpleDate',
  SELECT_LIST = 'selectList',
  ASYNC_SELECT_LIST = 'asyncSelectList',
  CHECK_LIST = 'checkList',
  ASYNC_CHECK_LIST = 'asyncCheckList',
  TEXT = 'text',
  NUMBER = 'number',
  SIMPLE_NUMBER = 'simpleNumber',
  DATE = 'date',
  AUTOCOMPLETE = 'autocomplete',
  CUSTOM = 'custom',
  TAGS = 'tags',
  STRINGLIST = 'stringList',
  MULTIAUTOCOMPLETE = 'multiAutocomplete'
}

export enum FilterVisibility {
  VISIBLE = 'visible',
  HIDDEN = 'hidden'
}

export enum TextFilterEncoding {
  BASE64 = 'base64',
  PLAINTEXT = 'plaintext'
}

export enum FilterAvailability {
  ALL = 'all',
  ONLY_FILTERS = 'onlyFilters'
}

export interface IFilterNumber extends IFilterConfigBase {
  type: FilterType.NUMBER;
  number?: INumberFilter;
}

export interface IFilterDate extends IFilterConfigBase {
  type: FilterType.DATE | FilterType.REDUCED_DATE;
  date?: IDateFilter;
  defaultValue?: any;
  hideEmpty?: boolean;
}

export interface IFilterCustom extends IFilterConfigBase {
  type: FilterType.CUSTOM;
  custom: ICustomFilter;
}

export interface ITpzcContainer extends IFilterCustom {
  showThirdPlaceOperator?: boolean;
  showInNotInOperator?: boolean;
}

export interface IFilterTags extends IFilterConfigBase {
  type: FilterType.TAGS;
  tags: ITagsFilter;
}

export interface IFilterStringList extends IFilterConfigBase {
  type: FilterType.STRINGLIST;
  strings: IStringListFilter;
}

export interface IFilterAutoComplete extends IFilterConfigBase {
  type: FilterType.MULTIAUTOCOMPLETE | FilterType.AUTOCOMPLETE;
  autocomplete: IAutocompleteFilter;
}

export interface IFilterText extends IFilterConfigBase {
  type: FilterType.TEXT;
  text?: ITextFilter;
  checkbox?: string;
  filledOption?: boolean;
  emptyOption?: boolean;
}

export interface IFilterAsyncSelectList extends IFilterConfigBase {
  type: FilterType.ASYNC_SELECT_LIST;
  asyncSelectList: IAsyncSelectListFilter;
}

export interface IFilterAsyncCheckList extends IFilterConfigBase {
  type: FilterType.ASYNC_CHECK_LIST;
  asyncCheckList: IAsyncCheckListFilter;
}

export interface IFilterRadioList extends IFilterConfigBase {
  type: FilterType.RADIO_LIST;
  // Filtre context
  radioList: IRadioListFilter;
  defaultValue?: IFilterRadioList['radioList']['values'][number]['code'];
}

export interface IFilterSelectList extends IFilterConfigBase {
  type: FilterType.SELECT_LIST;
  selectList: ISelectListFilter;
}

export interface IFilterCheckList extends IFilterConfigBase {
  type: FilterType.CHECK_LIST;
  checkList: ICheckListFilter;
  defaultValue?: IFilterCheckList['checkList']['values'][number]['code'];
}

interface IFilterConfigOthers extends IFilterConfigBase {
  type: FilterType.SIMPLE_DATE | FilterType.SIMPLE_NUMBER;
}

interface IFilterConfigBase {
  // Type de filtres
  type: FilterType;
  // Nom du filtre
  nameKey: string;
  // Disponibilité
  availability?: FilterAvailability;
  // Désactive le filtre
  disable?: boolean | Observable<boolean>;
  // Description du filtre
  descriptionKey?: string;
  // Valeur par defaut
  defaultValue?: any;
  // Visiblité par defaut
  visibility?: FilterVisibility;
  // Affiche le selecteur de vide
  showEmptySelector?: boolean;
  // Exclut la/les sélections au lieu de filtrer
  excludable?: boolean;
  // Selects an empty field in filters
  empty?: boolean;
}

/**
 * Description d'un filtre
 */
export type IFilterConfig =
  | IFilterConfigOthers
  | IFilterCheckList
  | IFilterSelectList
  | IFilterRadioList
  | IFilterAsyncCheckList
  | IFilterAsyncSelectList
  | IFilterText
  | IFilterAutoComplete
  | IFilterStringList
  | IFilterTags
  | IFilterCustom
  | IFilterDate
  | IFilterNumber
  | ITpzcContainer;

/**
 * Configuration des filtres
 */
export interface IFiltersConfig {
  [id: string]: IFilterConfig;
}

/**
 * Options des filtres
 */
export interface IFiltersOptions {
  // Liste des filtres
  filtersConfig?: IFiltersConfig;
  // Mode d'affichage des filtres
  showMode?: 'auto' | 'dropdown' | 'modal' | 'inline';
  // Taille min width des dropdown
  dropdownMinWidth?: string;
  // Affiche les filtres sous la barre
  showFiltersBottom?: boolean;

  hideSearch?: boolean;
  resetOnClear?: boolean;
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
  // Affiche ou non la barre en haut avec l'import/export des favoris, et les préférences
  showImportExportSettings?: boolean;
}

/**
 * Options de la liste de recherche
 */
export interface IListSearchOptions {
  // Nombre de ligne maximum
  maxLines?: number;
  // Delimiteur a utiliser
  delimiter?: string;
}

/**
 * Option de recherche
 */
export interface ISearchOptions {
  // Options de la sauvegarde
  save?: ISaveOptions;
  // Options des filtres
  filters?: IFiltersOptions;
  // Taille
  size?: 'small' | 'normal' | 'large';
  // Affichage condensé
  condensed?: boolean;
  // Affichage du text
  showInfoText?: boolean;
  // Text sous la barre
  infoTextKey?: string;
  // Placeholder sur la recherche
  placeholderKey?: string;
  // Placeholder sur la recherche par tags
  tagsPlaceholderKey?: string;
  // Force la bordure
  forceBorder?: boolean;
  // Autorise la recherche sur une liste d'éléments
  enableListSearch?: boolean;
  // Options de list d'éléments
  listSearch?: IListSearchOptions;
  // Limite la recherche à une liste de tags
  tagList?: Array<ISearchTagModel>;
  // Icône de l'input (par défaut fa-search)
  icon?: string;
}

export type FilterShowMode = 'single' | 'multi';
