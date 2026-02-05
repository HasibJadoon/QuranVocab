import { ElementRef } from '@angular/core';
import { Params } from '@angular/router';
import { TextSize } from './table.component';
import { Observable } from 'rxjs';

export type StripeMode = 'none' | 'vertical' | 'horizontal' | 'both';

export interface ITableOptions<E> {
  // Sauvegarde
  save?: ISaveOptions;
  // Colonnes
  columns: IColumnOptions<E>;
  // Ligne
  row?: IRowOptions<E>;
  // Actions
  actions?: IActionOptions<E>;
  // Entete du tableau
  header?: IHeaderOptions;
  // Affiche le double scroll
  doubleScroll?: boolean;
  // Rayure
  stripe?: {
    mode?: StripeMode;
    disable?: boolean;
    modes?: StripeMode[];
  };
  config?: {
    hide?: boolean;
    showPagination?: boolean;
    textSize?: TextSize;
  };
}

export interface IHeaderOptions {
  // Type d'entete de tableau
  type?: 'normal' | 'sticky';
  // Css a rajouter
  cssClass?: string;
}

export interface IColumnOptions<E> {
  // Si colonnes est retaillable
  resizable?: boolean;
  // Si les colonnes sont déplacable
  moveable?: boolean;
  // Si les colonnes peuvent être caché
  hiddenable?: boolean;
  // Les colonnes
  columnsConfig: IColumnsConfig<E>;
}

export interface IColumnsConfig<E> {
  // Une colonne
  [id: string]: ColumnConfig<E>;
}

export type GetOrFn<E, V> = string | ((item: E, index: number, key: string) => V | Observable<V>);

export interface IColumnConfig<E> {
  // Type de la colonne
  type?: ColumnType;
  // Nom de la colonne
  nameKey: string;
  // Alignement horizontal
  horizontalAlign?: Align;
  // Alignement vertical
  verticalAlign?: Align;
  // Css a rajouté
  cssClass?: GetOrFn<E, string>;
  minBreakpoint?: Breakpoint;
  maxBreakpoint?: Breakpoint;
  minWidth?: string;
  width?: string;
  maxWidth?: string;
  // Visibilité par défaut
  visibility?: 'visible' | 'hidden';
  notIf?: boolean;
  tooltip?: {
    value: GetOrFn<E, string>;
  };
  headerTooltip?: {
    value: GetOrFn<E, string>;
  };
}

export interface ITextColumnConfig<E> extends IColumnConfig<E> {
  type: ColumnType.text;
  text?: {
    value: GetOrFn<E, string>;
  };
}

export function isTextColumnConfig<E>(columnConfig: ColumnConfig<E>): columnConfig is ITextColumnConfig<E> {
  return columnConfig.type === ColumnType.text;
}

export interface ICurrencyColumnConfig<E> extends IColumnConfig<E> {
  type: ColumnType.currency;
  currency?: {
    value: GetOrFn<E, number>;
    symbol: GetOrFn<E, string>;
  };
}

export function isCurrencyColumnConfig<E>(columnConfig: ColumnConfig<E>): columnConfig is ICurrencyColumnConfig<E> {
  return columnConfig.type === ColumnType.currency;
}

export interface IDateColumnConfig<E> extends IColumnConfig<E> {
  type: ColumnType.date;
  date?: {
    value: GetOrFn<E, string>;
    format: GetOrFn<E, string>;
  };
}

export function isDateColumnConfig<E>(columnConfig: ColumnConfig<E>): columnConfig is IDateColumnConfig<E> {
  return columnConfig.type === ColumnType.date;
}

export interface IDistanceColumnConfig<E> extends IColumnConfig<E> {
  type: ColumnType.distance;
  distance?: {
    value: GetOrFn<E, number>;
  };
}

export function isDistanceColumnConfig<E>(columnConfig: ColumnConfig<E>): columnConfig is IDistanceColumnConfig<E> {
  return columnConfig.type === ColumnType.distance;
}

export interface ITagsColumnConfig<E> extends IColumnConfig<E> {
  type: ColumnType.tags;
  tags?: {
    value: GetOrFn<E, string[]>;
  };
}

export function isTagsColumnConfig<E>(columnConfig: ColumnConfig<E>): columnConfig is ITagsColumnConfig<E> {
  return columnConfig.type === ColumnType.tags;
}

export interface ICustomColumnConfig<E> extends IColumnConfig<E> {
  type: ColumnType.custom;
  custom?: {
    value: string;
    context?: any;
  };
}

export function isCustomColumnConfig<E>(columnConfig: ColumnConfig<E>): columnConfig is ICustomColumnConfig<E> {
  return columnConfig.type === ColumnType.custom;
}

export interface IMeaningColumnConfig<E> extends IColumnConfig<E> {
  type: ColumnType.meaning;
  meaning?: {
    value: GetOrFn<E, string>;
  };
}

export function isMeaningColumnConfig<E>(columnConfig: ColumnConfig<E>): columnConfig is IMeaningColumnConfig<E> {
  return columnConfig.type === ColumnType.meaning;
}

export interface ITranslateColumnConfig<E> extends IColumnConfig<E> {
  type: ColumnType.translate;
  translate?: {
    value: GetOrFn<E, string>;
    params?: (item: E, index: number, key: string) => object;
  };
}

export function isTranslateColumnConfig<E>(columnConfig: ColumnConfig<E>): columnConfig is ITranslateColumnConfig<E> {
  return columnConfig.type === ColumnType.translate;
}

export interface IListdicoColumnConfig<E> extends IColumnConfig<E> {
  type: ColumnType.listdico;
  listdico?: {
    value: GetOrFn<E, string>;
    prefixKey: string;
    forceUpperCase?: boolean;
  };
}

export function isListdicoColumnConfig<E>(columnConfig: ColumnConfig<E>): columnConfig is IListdicoColumnConfig<E> {
  return columnConfig.type === ColumnType.listdico;
}

export interface IBooleanColumnConfig<E> extends IColumnConfig<E> {
  type: ColumnType.boolean;
  boolean?: {
    value: GetOrFn<E, boolean>;
    useIcon?: boolean;
  };
}

export interface IIconColumnConfig<E> extends IColumnConfig<E> {
  type: ColumnType.icon;
  icon?: string | ((item: E, index: number, key: string) => string);
}

export function isBooleanColumnConfig<E>(columnConfig: ColumnConfig<E>): columnConfig is IBooleanColumnConfig<E> {
  return columnConfig.type === ColumnType.boolean;
}

export type ColumnConfig<E> =
  | ITextColumnConfig<E>
  | ICurrencyColumnConfig<E>
  | IDateColumnConfig<E>
  | IDistanceColumnConfig<E>
  | ITagsColumnConfig<E>
  | ICustomColumnConfig<E>
  | IMeaningColumnConfig<E>
  | ITranslateColumnConfig<E>
  | IListdicoColumnConfig<E>
  | IBooleanColumnConfig<E>
  | IIconColumnConfig<E>;

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type Align = 'start' | 'middle' | 'end';

export enum ColumnType {
  text = 'text',
  date = 'date',
  currency = 'currency',
  distance = 'distance',
  tags = 'tags',
  custom = 'custom',
  meaning = 'meaning',
  translate = 'translate',
  listdico = 'listdico',
  boolean = 'boolean',
  icon = 'icon'
}

export interface IRowOptions<E> {
  cssClass?: string | ((item: E, index: number) => string);
  trackBy?: string | ((item: E, index: number) => any);
  header?: IRowHeaderOptions<E>;
  extension?: IRowExtensionOptions<E>;
  select?: IRowSelectOptions<E>;
  showLineNumber?: boolean;
}

export interface IRowSelectOptions<E> {
  // La ligne peut être séléctionnée
  selectable: boolean;
  disabled?: (item: E, index) => boolean;
  selectAll?: boolean;
}

export interface IRowHeaderOptions<E> {
  cssClass?: string | ((item: E, index: number) => string);
  minWidth?: string;
  width?: string;
  maxWidth?: string;
  tooltip?: {
    value: GetOrFn<E, string>;
  };
}

export interface IRowExtensionOptions<E> {
  cssClass?: string | ((item: E, index: number) => string);
}

export interface IActionOptions<E> {
  mode?: ActionMode;
  actionsConfig?: IActionsConfig<E>;
  column?: IColumnAction;
}

export type ActionMode = 'column';

export interface IColumnAction {
  // Type de la colonne action, si custom alors actionsConfig n'est pas utilisé
  type?: ColumnActionType;
  minWidth?: string;
  width?: string;
  maxWidth?: string;
  position?: PositionOption;
}

export type PositionOption = 'start' | 'end';

export type ColumnActionType = 'auto' | 'full' | 'mini' | 'custom';

export interface IActionsConfig<E> {
  [key: string]: IActionConfig<E>;
}

export interface IActionConfig<E> {
  nameKey?: string;
  params?: (item: E, index: number, key: string) => object;
  icon?: string | ((item: E, index: number, key: string) => string);
  badgeIcon?: string | ((item: E, index: number, key: string) => string);
  cssClass?: string | ((item: E, index: number, key: string) => string);
  disabled?: (item: E, index: number, key: string) => boolean | Observable<boolean>;
  hidden?: (item: E, index: number, key: string) => boolean | Observable<boolean>;
  action?: (item: E, index: number, key: string, button: ElementRef | HTMLElement) => void;
  routerLink?: (item: E, index: number, key: string) => any[] | string;
  target?: '_blank' | '_self';
  routerQueryParam?: (item: E, index: number, key: string) => Params;
  routerState?: (
    item: E,
    index: number,
    key: string
  ) => {
    [k: string]: any;
  };
  disableTooltip?: boolean;
}

export interface ISaveOptions {
  // Id unique de la sauvegarde
  id: string;
  hidden?: boolean;
}
