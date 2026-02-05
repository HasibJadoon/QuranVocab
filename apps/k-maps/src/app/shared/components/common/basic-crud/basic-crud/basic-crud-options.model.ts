import { McitDropdownRef } from '@lib-shared/common/dropdown/dropdown-ref';
import { ISearchOptions } from '../../search/search-options';
import { Observable } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { IFacetOptions } from '../../facet-field/facet-options';
import { IFacetDataModel, IFacetModel } from '../../facet-field/facet-model';
import { IActionsConfig, ISaveOptions, ITableOptions } from '../../table/table-options';
import { ISearchModel } from '../../search/search-model';
import { Params } from '@angular/router';
import { IGroupOption } from '@lib-shared/common/group/group-options';
import { ElementRef } from '@angular/core';

export interface BasicCrudTableOptions<T> {
  // Sauvegarde
  save?: ISaveOptions;
  route?: {
    disabled?: boolean;
    prefix?: string;
    toQuery?: (searchBox: ISearchModel, facetBox: IFacetModel) => Params;
    fromQuery?: (params: Params) => { searchBox?: ISearchModel; facetBox?: IFacetModel };
  };
  table: {
    tableOptions?: ITableOptions<T>; // The 'actions' part will be set automatically
    defaultPerPage?: 10 | 20 | 50 | 100;
    groupOptions?: { [key: string]: IGroupOption };
    searchOptions: ISearchOptions;
    searchCall: (searchValue: string, filters: { [key: string]: any }, page: number, perPage: number) => Observable<HttpResponse<T[]>>;
    searchByAxeCall?: (axe: string, query: string, page: number, per_page: number, filters: any, sort: string, nullsLast: boolean) => Observable<HttpResponse<{ _id: string; count: number }[]>>;
    // Use item custom
    itemCustom?: {
      // Track by
      trackBy?: string | ((item: T, index: number) => any);
      // one item for line or multi
      grid: 'one' | 'multi';
      multi?: {
        // Min width for multi (default 350px)
        minWidth?: string;
        // Ratio for multi (default 4 / 3)
        ratio?: string;
      };
    };
    // Hide searchbox field
    hideSearchField?: boolean;
  };
  facet?: {
    facetOptions: IFacetOptions;
    categoriesCall: (searchValue: string, filters: { [key: string]: any }) => Observable<IFacetDataModel | HttpResponse<IFacetDataModel>>;
  };
  crud?: {
    view?: {
      // This component will receive two argument from DialogData:
      // - element: the object to view
      // - popUpKind: the action kind: 'VIEW'
      viewComponent?;
      // Set to true to make the button appear
      viewButton?: boolean | Observable<boolean>; // default: false
      // View element custom
      viewElement?: (element: T) => Observable<void>;
    };
    upsert?: {
      // This component will receive two arguments from DialogData:
      // - element: the object to create/edit/clone
      // - popUpKind: the action kind: 'CREATE' / 'EDIT' / 'CLONE'
      upsertComponent?;
      // Set to true to make the button appear
      addButton?: boolean | Observable<boolean>; // default: false
      // Set to true to make the button appear
      editButton?: boolean | Observable<boolean>; // default: false
      // Set to true to make the button appear
      cloneButton?: boolean | Observable<boolean>; // default: false
      // Set to true to make the button appear
      exportButton?: boolean | Observable<boolean>; // default: false
      // Add element custom
      addElement?: () => Observable<T>;
      // Edit element custom
      editElement?: (element: T) => Observable<T>;
      // Clone element custom
      cloneElement?: (element: T) => Observable<T>;
      // Export element custom
      exportElement?: (element: T) => Observable<T>;
    };
    delete?: {
      deleteCall: (element: T) => Observable<void | string>;
      // Set to true to make the button appear
      deleteButton?: boolean | Observable<boolean>; // default: false
      // Set to true to disabled the button
      disabledButton?: (element: T) => boolean; // default: false
      // Translate keys
      keys?: {
        deleteTitle?: string;
        deleteQuestion?: string;
        deleteSuccess?: string;
      };
    };
    import?: {
      // Import call on click
      importCall: (buttonRef: ElementRef) => void;
      // Set to true to make the button appear
      importButton?: boolean | Observable<boolean>; // default: false
      // Custom import button text
      importButtonText?: string;
      // Import template asset link
      templateLink?: string;
      // Import template Call (used only if templateLink is not filled)
      templateCall?: () => void;
    };
    export?: {
      // Export call on click
      exportCall: (count: number, searchValue: string, filters: { [key: string]: any }, buttonRef: ElementRef, results?: any[]) => void;
      // Set to true to make the button appear
      exportButton?: boolean | Observable<boolean>; // default: false
      // Set to true to make the button disabled
      exportDisabled?: Observable<boolean>; // default: false
      // Custom export button tooltip when disabled
      exportDisabledTooltip?: string;
      // Custom export button text
      exportButtonText?: string;
      // Set export limit if exceeds the button will gray out
      exportLimit?: number;
    };
    // Properties for the ace editor button
    code?: {
      // Field where the json is stored
      codeField?: string; // default: 'code'
      // Set to true to make the button appear
      codeButton?: boolean | Observable<boolean>; // default: false
    };
    // Properties for the info popup (creation/update infos)
    info?: {
      // Set to true to make the button appear
      infoButton?: boolean | Observable<boolean>; // default: false
      // Field title
      titleField?: string; // default: filterFieldOnUpsert
    };
    // Additional actions
    additionalActions?: IActionsConfig<T>;
    // hide actions
    hideActions?: boolean; // default false
    // Modal panel
    modalPanel?: string;
    // Modal Sizes ('modal-sm' / 'modal-md' / 'modal-lg' / 'modal-xl')
    modalSizesGlobal?: string; // default: 'modal-xl'
    modalSizes?: {
      view?: string; // default: modalSizesGlobal
      add?: string; // default: modalSizesGlobal
      edit?: string; // default: modalSizesGlobal
      clone?: string; // default: modalSizesGlobal
    };
    // Modal disable drag
    modalDisableDrag?: boolean;
    // Optionally specify the field of the created/edited object which will be put in the search bar after creation/edition
    filterFieldOnUpsert?: string; // default: no filter added after creation/edition
    // Optionally get one element before creation/edition/view/clone
    getCall?: (element: T) => Observable<T>;
  };
}
