import { Component, ContentChild, ContentChildren, Input, QueryList, ViewChild } from '@angular/core';
import { ISearchModel } from '../../search/search-model';
import { ISearchOptions } from '../../search/search-options';
import { ITableOptions } from '../../table/table-options';
import { Observable, Subject } from 'rxjs';
import { McitColumnCustomDirective } from '../../table/directives/column-custom.directive';
import { IFacetDataModel, IFacetModel } from '../../facet-field/facet-model';
import { IFacetOptions } from '../../facet-field/facet-options';
import { McitRowExtensionCustomDirective } from '../../table/directives/row-extension-custom.directive';
import { McitTableComponent } from '../../table/table.component';
import { McitRowHeaderCustomDirective } from '../../table/directives/row-header-custom.directive';
import { IMultipleFilters, IReferenceTypes } from '../../multiple-filters-modal/multiple-filters-modal.component';

@Component({
  selector: 'mcit-basic-crud-table',
  templateUrl: './basic-crud-table.component.html'
})
export class McitBasicCrudTableComponent<T> {
  // crud
  @Input()
  addElement: () => void;
  @Input()
  addElementHidden: boolean;

  // table
  @Input()
  elements$: Observable<T[]>;
  @Input()
  searchOptions: ISearchOptions;
  @Input()
  searchBox: ISearchModel;
  @Input()
  querySubject: Subject<ISearchModel>;
  @Input()
  tableOptions: ITableOptions<T>;
  @Input()
  waiting: boolean;

  // facet
  @Input()
  categories$: Observable<IFacetDataModel>;
  @Input()
  facetOptions: IFacetOptions;
  @Input()
  facetBox: IFacetModel;
  @Input()
  facetSubject: Subject<IFacetModel>;
  @Input()
  waitingCategories: boolean;

  // multiple filter
  @Input()
  multipleFilters: IMultipleFilters;
  @Input()
  multipleFiltersLength = 0;
  @Input()
  referenceTypes: IReferenceTypes;
  @Input()
  doOpenMultipleFilters: () => void;
  @Input()
  refreshButton = false;
  @Input()
  doRefresh: () => void;

  // util
  @Input()
  page: number;
  @Input()
  perPage: number;
  @Input()
  total: number;
  @Input()
  totalPages: number;
  @Input()
  doPage: (page: number) => void;
  @Input()
  doPerPage: (page: number) => void;

  @ContentChildren(McitColumnCustomDirective, { descendants: false })
  columnCustoms: QueryList<McitColumnCustomDirective>;

  @ContentChild(McitRowHeaderCustomDirective)
  rowHeaderCustom: McitRowHeaderCustomDirective;

  @ContentChild(McitRowExtensionCustomDirective)
  rowExtensionCustom: McitRowExtensionCustomDirective;

  @ViewChild(McitTableComponent) private mcitTableComponent: McitTableComponent<T>;

  @Input()
  clearMultipleFilters: () => void = () => undefined;
}
