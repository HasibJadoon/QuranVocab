import { Component, ContentChild, ContentChildren, ElementRef, EventEmitter, Input, OnInit, Output, QueryList, ViewChild } from '@angular/core';
import { ISearchModel } from '../../search/search-model';
import { isObservable, merge, Observable, of, Subject, timer } from 'rxjs';
import { McitColumnCustomDirective } from '../../table/directives/column-custom.directive';
import { IFacetDataModel, IFacetModel } from '../../facet-field/facet-model';
import { McitRowExtensionCustomDirective } from '../../table/directives/row-extension-custom.directive';
import { McitTableComponent } from '../../table/table.component';
import { McitRowHeaderCustomDirective } from '../../table/directives/row-header-custom.directive';
import { BasicCrudTableOptions } from './basic-crud-options.model';
import { PER_PAGE, PER_PAGES } from '../../helpers/pagination.helper';
import { McitDialog } from '../../dialog/dialog.service';
import { ActivatedRoute, Router } from '@angular/router';
import { McitPopupService } from '../../services/popup.service';
import { TranslateService } from '@ngx-translate/core';
import { McitSearchService } from '../../search/search.service';
import { McitQuestionModalService } from '../../question-modal/question-modal.service';
import { McitAceEditorModalService } from '../../ace-editor-modal/ace-editor-modal.service';
import { McitInfoTracableModalService } from '../../info-tracable-modal/info-tracable-modal.service';
import { McitFacetService } from '../../facet-field/facet.service';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { PopUpKind } from '../pop-up-kind.domain';
import * as lodash from 'lodash';
import { TableActionKind, TableActionsUtil } from '../table-actions-util';
import { McitItemCustomDirective } from './basic-crud-item-custom.directive';
import * as FileSaver from 'file-saver';

const DEFAULT_MODAL_SIZE = 'modal-lg';

@Component({
  selector: 'mcit-basic-crud',
  styleUrls: ['./basic-crud.component.scss'],
  templateUrl: './basic-crud.component.html'
})
export class McitBasicCrudComponent<T> implements OnInit {
  @Input()
  options: BasicCrudTableOptions<T>;
  @Output() filtersChanged = new EventEmitter<{ [key: string]: string }>();

  // Pagination
  perPage: number;
  page: number;
  total: number;
  totalPages: number;
  paginationSubject = new Subject<{ page: number; per_page: number }>();

  // Table
  searchBox: ISearchModel;
  waiting;
  querySubject = new Subject<ISearchModel>();
  elements$: Observable<T[]>;
  refreshSubject: Subject<boolean> = new Subject<boolean>();

  // Facet
  facetBox: IFacetModel;
  waitingCategories;
  facetSubject = new Subject<IFacetModel>();
  categories$: Observable<IFacetDataModel>;

  // Misc
  isTableActionsSet = false;

  @ContentChildren(McitColumnCustomDirective, { descendants: false })
  columnCustoms: QueryList<McitColumnCustomDirective>;

  @ContentChild(McitRowHeaderCustomDirective)
  rowHeaderCustom: McitRowHeaderCustomDirective;

  @ContentChild(McitRowExtensionCustomDirective)
  rowExtensionCustom: McitRowExtensionCustomDirective;

  @ContentChild(McitItemCustomDirective)
  itemCustom: McitItemCustomDirective;

  @ViewChild(McitTableComponent) private mcitTableComponent: McitTableComponent<T>;

  results: any[];

  constructor(
    private dialog: McitDialog,
    private router: Router,
    private route: ActivatedRoute,
    private popupService: McitPopupService,
    private translateService: TranslateService,
    private searchService: McitSearchService,
    private mcitQuestionModalService: McitQuestionModalService,
    private aceEditorModalService: McitAceEditorModalService,
    private infoTracableModalService: McitInfoTracableModalService,
    private facetService: McitFacetService
  ) {}

  ngOnInit(): void {
    // Pagination
    this.page = this.route.snapshot.queryParams.page ? Number(this.route.snapshot.queryParams.page) : 1;
    this.perPage = this.route.snapshot.queryParams.per_page ? Number(this.route.snapshot.queryParams.per_page) : this.options?.table?.defaultPerPage ?? PER_PAGE;

    if (!this.options.route?.disabled) {
      // Get search & facet model form query params
      if (this.options.route?.fromQuery) {
        const { searchBox, facetBox } = this.options.route.fromQuery(this.route.snapshot.queryParams);
        this.searchBox = searchBox;
        if (this.options.facet) {
          this.facetBox = facetBox;
        }
      } else {
        this.searchBox = this.searchService.queryParamsToSearchModel(this.options.table.searchOptions, this.route.snapshot.queryParams, this.options.route?.prefix);
        if (this.options.facet) {
          this.facetBox = this.facetService.queryParamsToFacetModel(this.options.facet.facetOptions, this.route.snapshot.queryParams, this.options.route?.prefix);
        }
      }
    }

    // Table elements observable
    this.setTableObservable();

    // Facet categories observable
    if (this.options.facet) {
      this.setFacetObservable();
    }

    this.setTableActions();
  }

  trackByFn(index: number, item: T): any {
    const tb = this.options?.table?.itemCustom?.trackBy;
    if (!tb) {
      return item;
    }
    return lodash.isString(tb) ? lodash.get(item, tb) : tb(item, index);
  }

  private setTableActions() {
    this.options.table.tableOptions.actions = !this.options.crud.hideActions
      ? TableActionsUtil.getTableActionsWithAdditionals(
          this.options.crud?.additionalActions ?? {},
          {
            fn: (item) => this.viewElement(item),
            hidden: this.toHiddenObservable(this.options.crud?.view?.viewButton, true),
            kind: TableActionKind.VIEW
          },
          {
            fn: (item) => this.editElement(item),
            hidden: this.toHiddenObservable(this.options.crud?.upsert?.editButton, true),
            kind: TableActionKind.EDIT
          },
          {
            fn: (item) => this.cloneElement(item),
            hidden: this.toHiddenObservable(this.options.crud?.upsert?.cloneButton, true),
            kind: TableActionKind.CLONE
          },
          {
            fn: (item) => this.exportElement(item),
            hidden: this.toHiddenObservable(this.options.crud?.upsert?.exportButton, true),
            kind: TableActionKind.EXPORT
          },
          {
            fn: (item) => this.codeElement(this.options.crud?.code?.codeField, item),
            hidden: this.toHiddenObservable(this.options.crud?.code?.codeButton, true),
            kind: TableActionKind.CODE
          },
          {
            fn: (item) => this.infoElement(item),
            hidden: this.toHiddenObservable(this.options.crud?.info?.infoButton, true),
            kind: TableActionKind.INFO
          },
          {
            fn: (item) => this.deleteElement(item),
            hidden: this.toHiddenObservable(this.options.crud?.delete?.deleteButton, true),
            disabled: this.options.crud?.delete?.disabledButton ? this.options.crud?.delete?.disabledButton : () => false,
            kind: TableActionKind.DELETE
          }
        )
      : null;

    this.isTableActionsSet = true;
  }

  private setTableObservable() {
    this.elements$ = merge(
      timer(0), // To avoid ExpressionChangedAfterCheck
      this.refreshSubject.asObservable(),
      this.querySubject.asObservable().pipe(
        tap((searchModel) => {
          this.searchBox = searchModel;
          this.page = 1;
        })
      ),
      this.facetSubject.asObservable().pipe(
        tap((facetModel: IFacetModel) => {
          this.facetBox = facetModel;
          this.page = 1;
        })
      ),
      this.paginationSubject.asObservable().pipe(
        tap((p: { page: number; per_page: number }): void => {
          this.page = p.page < 1 ? 1 : p.page;
          this.perPage = PER_PAGES.indexOf(p.per_page) ? p.per_page : this.options?.table?.defaultPerPage ?? PER_PAGE;
        })
      ),
      this.translateService.onLangChange
    ).pipe(
      tap(() => (this.waiting = true)),
      switchMap(() => {
        if (!this.options.route?.disabled) {
          this.router.navigate(['./'], {
            relativeTo: this.route,
            queryParams: {
              page: this.page,
              per_page: this.perPage,
              ...(this.options.route?.toQuery
                ? this.options.route.toQuery(this.searchBox, this.facetBox)
                : {
                    ...this.searchService.searchModelToQueryParams(this.options.table.searchOptions, this.searchBox, this.options.route?.prefix),
                    ...(this.options.facet ? this.facetService.facetModelToQueryParams(this.options.facet.facetOptions, this.facetBox, this.options.route?.prefix) : {})
                  })
            },
            replaceUrl: true
          });
        }

        const searchValue = this.searchBox?.text ?? '';
        const filters: { [key: string]: any } = this.getFilters();
        this.filtersChanged.emit(filters);
        return this.options.table.searchCall(searchValue, filters, this.page, this.perPage).pipe(
          tap((res: HttpResponse<Array<any>>): void => {
            this.total = Number(res.headers.get('X-Total'));
            this.totalPages = Number(res.headers.get('X-Total-Pages'));
          }),
          map((res: HttpResponse<Array<any>>): Array<any> => res.body),
          tap((hola) => (this.results = hola)),
          catchError((err: HttpErrorResponse): Observable<Array<any>> => {
            this.popupService.showError();
            return of([]);
          })
        );
      }),
      tap(() => (this.waiting = false))
    );
  }

  private setFacetObservable() {
    this.categories$ = merge(
      timer(0), // To avoid ExpressionChangedAfterCheck
      this.refreshSubject.asObservable(),
      this.querySubject.asObservable().pipe(
        tap((searchModel: ISearchModel) => {
          this.searchBox = searchModel;
          this.page = 1;
        })
      ),
      this.facetSubject.asObservable().pipe(
        tap((facetModel) => {
          this.facetBox = facetModel;
          this.page = 1;
        })
      ),
      this.translateService.onLangChange
    ).pipe(
      tap(() => (this.waitingCategories = true)),
      switchMap(() => {
        const searchValue = this.searchBox?.text ?? '';
        const filters: { [key: string]: any } = this.getFilters();
        this.filtersChanged.emit(filters);
        return this.options.facet.categoriesCall(searchValue, filters).pipe(
          map((res: IFacetDataModel | HttpResponse<IFacetDataModel>): IFacetDataModel => (res instanceof HttpResponse ? res.body : res)),
          catchError((err: HttpErrorResponse): Observable<IFacetDataModel> => {
            this.popupService.showError();
            return of({});
          })
        );
      }),
      tap(() => (this.waitingCategories = false))
    );
  }

  public doPage(page: number): void {
    this.paginationSubject.next({ page, per_page: this.perPage });
  }

  public doPerPage(perPage: number): void {
    this.paginationSubject.next({ page: 1, per_page: perPage });
  }

  private getFilters(): { [key: string]: string } {
    return {
      ...(this.searchBox?.filters ?? {}),
      ...(this.facetBox?.categories ?? {})
      // ...this.additionalFilters // TODO part 2
    };
  }

  private getElement(element: T): Observable<T> {
    return this.options.crud.getCall ? this.options.crud.getCall(element) : of(element);
  }

  public viewElement(element: T): void {
    this.getElement(element).subscribe((elm) => {
      if (this.options.crud.view.viewElement) {
        this.options.crud.view.viewElement(elm).subscribe();
      } else {
        this.dialog
          .open(this.options.crud.view.viewComponent, {
            dialogClass: this.options.crud.modalSizes?.view ?? this.options.crud.modalSizesGlobal ?? DEFAULT_MODAL_SIZE,
            data: {
              element: elm,
              popUpKind: PopUpKind.VIEW
            }
          })
          .afterClosed()
          .subscribe();
      }
    });
  }

  public addElement(): void {
    if (this.options.crud.upsert.addElement) {
      this.options.crud.upsert.addElement().subscribe((added) => {
        if (added) {
          this.searchBox = {
            ...(this.options.crud.filterFieldOnUpsert && { text: added[this.options.crud.filterFieldOnUpsert] })
          };
          this.refreshSubject.next(true);
        }
      });
    } else {
      this.dialog
        .open(this.options.crud.upsert.upsertComponent, {
          panelClass: this.options.crud.modalPanel,
          dialogClass: this.options.crud.modalSizes?.add ?? this.options.crud.modalSizesGlobal ?? DEFAULT_MODAL_SIZE,
          data: {
            popUpKind: PopUpKind.CREATE
          },
          disableDrag: this.options.crud.modalDisableDrag
        })
        .afterClosed()
        .subscribe((added) => {
          if (added) {
            this.searchBox = {
              ...(this.options.crud.filterFieldOnUpsert && { text: added[this.options.crud.filterFieldOnUpsert] })
            };
            this.refreshSubject.next(true);
          }
        });
    }
  }

  public editElement(element: T): void {
    this.getElement(element).subscribe((elm) => {
      if (this.options.crud.upsert.editElement) {
        this.options.crud.upsert.editElement(elm).subscribe((edited) => {
          if (edited) {
            this.refreshSubject.next(true);
          }
        });
      } else {
        this.dialog
          .open(this.options.crud.upsert.upsertComponent, {
            panelClass: this.options.crud.modalPanel,
            dialogClass: this.options.crud.modalSizes?.edit ?? this.options.crud.modalSizesGlobal ?? DEFAULT_MODAL_SIZE,
            data: {
              element: elm,
              popUpKind: PopUpKind.EDIT
            },
            disableDrag: this.options.crud.modalDisableDrag
          })
          .afterClosed()
          .subscribe((edited) => {
            if (edited) {
              this.refreshSubject.next(true);
            }
          });
      }
    });
  }

  public cloneElement(element: T): void {
    this.getElement(element).subscribe((elm) => {
      if (this.options.crud.upsert.cloneElement) {
        this.options.crud.upsert.cloneElement(element).subscribe((cloned) => {
          if (cloned) {
            this.searchBox = {
              ...(this.options.crud.filterFieldOnUpsert && { text: cloned[this.options.crud.filterFieldOnUpsert] })
            };
            this.refreshSubject.next(true);
          }
        });
      } else {
        this.dialog
          .open(this.options.crud.upsert.upsertComponent, {
            panelClass: this.options.crud.modalPanel,
            dialogClass: this.options.crud.modalSizes?.clone ?? this.options.crud.modalSizesGlobal ?? DEFAULT_MODAL_SIZE,
            data: {
              element,
              popUpKind: PopUpKind.CLONE
            },
            disableDrag: this.options.crud.modalDisableDrag
          })
          .afterClosed()
          .subscribe((cloned) => {
            if (cloned) {
              this.searchBox = {
                ...(this.options.crud.filterFieldOnUpsert && { text: cloned[this.options.crud.filterFieldOnUpsert] })
              };
              this.refreshSubject.next(true);
            }
          });
      }
    });
  }

  public exportElement(element: T): void {
    this.getElement(element).subscribe((elm) => {
      if (this.options.crud.upsert.exportElement) {
        this.options.crud.upsert.exportElement(element).subscribe();
      } else {
        of(JSON.stringify(lodash.omit(elm as any, '_id', 'created_date', 'created_by', 'updated_date', 'updated_by')))
          .pipe(
            map((part) => new Blob([part], { type: 'application/json' })),
            tap((blob) => FileSaver.saveAs(blob, `export.json`))
          )
          .subscribe();
      }
    });
  }

  public codeElement(codeField: string | undefined, element: T): void {
    this.getElement(element).subscribe((elm) => {
      this.aceEditorModalService.open(lodash.get(element, codeField ?? 'code'), element);
    });
  }

  public infoElement(element: T): void {
    this.getElement(element).subscribe((elm) => {
      this.infoTracableModalService.open(lodash.get(element, this.options?.crud?.info?.titleField ?? this.options.crud?.filterFieldOnUpsert ?? '_id'), lodash.pick(element, ['created_date', 'created_by', 'updated_date', 'updated_by']));
    });
  }

  public deleteElement(element: T): void {
    this.mcitQuestionModalService
      .showQuestion(this.options.crud.delete?.keys?.deleteTitle ?? 'BASIC_CRUD.DELETE_TITLE', this.options.crud.delete?.keys?.deleteQuestion ?? 'BASIC_CRUD.DELETE_QUESTION', 'COMMON.YES', 'COMMON.NO')
      .subscribe((result) => {
        if (result) {
          this.options.crud.delete.deleteCall(element).subscribe(
            (res) => {
              if (res !== 'null') {
                this.refreshSubject.next(true);
                this.popupService.showSuccess(this.options.crud.delete?.keys?.deleteSuccess ?? 'BASIC_CRUD.DELETE_SUCCESS');
              }
            },
            () => {
              this.popupService.showError();
            }
          );
        }
      });
  }

  public exportElements(buttonRef: ElementRef): void {
    console.log('exportElements: ', this.results);
    this.options.crud.export.exportCall(this.total, this.searchBox?.text ?? '', this.getFilters(), buttonRef, this.results);
  }

  public importElements(buttonRef: ElementRef): void {
    this.options.crud.import.importCall(buttonRef);
  }

  private toHiddenObservable(value: boolean | Observable<boolean>, defaultValue: boolean): Observable<boolean> {
    if (isObservable(value)) {
      return value.pipe(map((r) => !r));
    }
    return value != null ? of(!value) : of(defaultValue);
  }

  public refreshTable() {
    this.mcitTableComponent.refresh();
  }
}
