import { ChangeDetectorRef, Component, ContentChild, ContentChildren, ElementRef, EventEmitter, Input, OnInit, Output, QueryList, ViewChild } from '@angular/core';
import { ISearchModel } from '../../search/search-model';
import { concat, EMPTY, forkJoin, iif, isObservable, merge, Observable, of, Subject, timer } from 'rxjs';
import { McitColumnCustomDirective } from '../../table/directives/column-custom.directive';
import { IFacetDataModel, IFacetModel } from '../../facet-field/facet-model';
import { McitRowExtensionCustomDirective } from '../../table/directives/row-extension-custom.directive';
import { McitRowHeaderCustomDirective } from '../../table/directives/row-header-custom.directive';
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
import { catchError, concatMap, distinctUntilChanged, filter, map, mergeMap, reduce, skip, startWith, switchMap, take, tap } from 'rxjs/operators';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { PopUpKind } from '../pop-up-kind.domain';
import * as lodash from 'lodash';
import { TableActionKind, TableActionsUtil } from '../table-actions-util';
import * as FileSaver from 'file-saver';
import { GroupDirection, IGroup } from '@lib-shared/common/group/group-options';
import { McitStorage } from '@lib-shared/common/storage/mcit-storage';
import { IColumnConfig } from '@lib-shared/common/table/table-options';
import { BasicCrudTableOptions } from '@lib-shared/common/basic-crud/basic-crud/basic-crud-options.model';
import { McitContextHeaderService } from '@lib-shared/common/context-header/services/context-header.service';
import { McitActionGroupRowCustomDirective } from '@lib-shared/common/table-group/directives/action-group-row-custom.directive';
import { McitGroupTableToolbarCustomDirective } from './directives/action-group-row-custom.directive';
import { McitCoreConfig } from '@lib-shared/common/helpers/provider.helper';
import { McitTablePrefsHttpService } from '@lib-shared/common/services/table-prefs-http.service';
import { ISaveStorage } from '@lib-shared/common/table/options/table-options.component';
import { McitTableComponent } from '@lib-shared/common/table/table.component';

const DEFAULT_MODAL_SIZE = 'modal-lg';

interface IElementsContainer<T> {
  [index: string]:
    | string
    | Observable<{
        type: string;
        value?: {
          page: number;
          total: number;
          totalPages?: number;
          results: T[];
          next: (pageClicked: number) => void | undefined;
        };
      }>;
}

interface IGroupsContainer {
  type: 'groups';
  nameKey: string;
  groups: Observable<{
    type: string;
    value?: {
      page: number;
      total: number;
      results: any[];
      next: (pageClicked: number) => void | undefined;
    };
  }>;
}

type OpenMode = 'all' | 'close' | 'first';

export interface IPagination {
  page: number;
  total: number | string;
  per_page: number;
}

@Component({
  selector: 'mcit-basic-crud-group',
  styleUrls: ['./basic-crud-group.component.scss'],
  templateUrl: './basic-crud-group.component.html'
})
export class McitBasicCrudGroupComponent<T> implements OnInit {
  @Input()
  options: BasicCrudTableOptions<T>;
  @Input() storageGroupKey: string;
  @Input() storageOpenModeKey: string;
  @Output()
  selectEvent = new EventEmitter<{ items: T[]; forceSelect: boolean; shiftKey: boolean }>();

  @ViewChild('tableCrud')
  tableCrud: McitTableComponent<T>;

  @Input()
  set pagination(pagination: IPagination) {
    this.perPage = pagination.per_page;
    this.page = pagination.page;
    this.total = Number(pagination.total);
    this.totalPages = Math.ceil(this.total / this.perPage);
    this.changeDetectorRef.detectChanges();
  }

  get pagination(): IPagination {
    return {
      page: this.page,
      per_page: this.perPage,
      total: this.total
    };
  }

  // Pagination
  perPage: number;
  page: number = 1;
  total: number;
  totalPages: number;

  // Table
  searchBox: ISearchModel;
  waiting;
  querySubject = new Subject<ISearchModel>();
  container$: Observable<IElementsContainer<T>>;
  refreshSubject: Subject<boolean> = new Subject<boolean>();
  refreshGroupsSubject: Subject<boolean> = new Subject<boolean>();
  private paginationSubject = new Subject<{ page: number; per_page: number }>();

  // Facet
  facetBox: IFacetModel;
  waitingCategories;
  facetSubject = new Subject<IFacetModel>();
  categories$: Observable<IFacetDataModel>;
  groups$: Observable<IGroup[]>;
  columns$: Observable<({ key: string; visible: boolean } & IColumnConfig<string>)[]>;
  refreshColumnsSubject = new Subject<boolean>();

  refreshOpenModeSubject = new Subject<boolean>();
  openMode$: Observable<OpenMode>;

  // Misc
  isTableActionsSet = false;

  @ContentChildren(McitColumnCustomDirective, { descendants: false })
  columnCustoms: QueryList<McitColumnCustomDirective>;

  @ContentChild(McitRowHeaderCustomDirective)
  rowHeaderCustom: McitRowHeaderCustomDirective;

  @ContentChild(McitRowExtensionCustomDirective)
  rowExtensionCustom: McitRowExtensionCustomDirective;

  @ContentChild(McitActionGroupRowCustomDirective)
  actionGroupRowCustom: McitActionGroupRowCustomDirective;

  @ContentChild(McitGroupTableToolbarCustomDirective)
  groupTableToolbarCustom: McitGroupTableToolbarCustomDirective;

  constructor(
    private dialog: McitDialog,
    private config: McitCoreConfig,
    private router: Router,
    private route: ActivatedRoute,
    private popupService: McitPopupService,
    private translateService: TranslateService,
    private searchService: McitSearchService,
    private changeDetectorRef: ChangeDetectorRef,
    private mcitQuestionModalService: McitQuestionModalService,
    private aceEditorModalService: McitAceEditorModalService,
    private infoTracableModalService: McitInfoTracableModalService,
    private facetService: McitFacetService,
    private storage: McitStorage,
    private contextHeaderService: McitContextHeaderService,
    private tablePrefsHttpService: McitTablePrefsHttpService
  ) {}

  ngOnInit(): void {
    // Pagination
    this.page = this.route?.snapshot?.queryParams?.q?.length > 0 ? 1 : this.route.snapshot.queryParams.page ? Number(this.route.snapshot.queryParams.page) : 1;
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

    this.groups$ = this.refreshGroupsSubject.asObservable().pipe(
      startWith(true),
      filter((elem) => elem),
      switchMap(() => this.getCurrentGroups())
      // tap((group) => {
      //   if (group.length) {
      //     this.querySubject.next({ ...this.searchBox, filters: { ...this.searchBox.filters } });
      //   }
      // })
    );

    this.openMode$ = this.refreshOpenModeSubject.asObservable().pipe(
      startWith(true),
      filter((elem) => elem),
      switchMap(() => this.getCurrentOpenMode())
    );

    this.columns$ = this.refreshColumnsSubject.asObservable().pipe(
      startWith(true),
      filter((elem) => elem),
      switchMap(() =>
        this.getCurrentColumns().pipe(
          catchError(() => of(null)),
          map((list) => {
            return list.map((l) => ({
              ...l,
              ...this.options.table.tableOptions.columns.columnsConfig[l.key]
            }));
          })
        )
      )
    );
  }

  private buildCurrent(): ISaveStorage {
    return {
      text_size: this.tableCrud.tableOptionsComponent.textSize$.value,
      show_line_number: this.tableCrud.tableOptionsComponent.showLineNumber$.value,
      stripe: this.tableCrud.tableOptionsComponent.stripe$.value,
      columns: this.tableCrud.tableOptionsComponent.columns$.value.reduce((acc, x, i) => {
        const p = {
          visible: null,
          width: null,
          position: null
        };
        if ((x.visible && x.visibility === 'hidden') || (!x.visible && (x.visibility == null || x.visibility === 'visible'))) {
          p.visible = x.visible;
        }
        if (x.resizeWidth != null) {
          p.width = x.resizeWidth;
        }
        if (x.position != null && x.position !== i) {
          p.position = x.position;
        }
        acc[x.key] = lodash.omitBy(p, lodash.isNil);
        return acc;
      }, {})
    };
  }

  refreshFavorite() {
    this.tableCrud?.tableOptionsComponent?.refreshFavorite();
  }

  saveFavorite(name: string): Observable<any> {
    const key = `table-${this.config.app}-${this.options.save.id}`;
    return this.tablePrefsHttpService.get(key, 'favorites').pipe(
      concatMap((ss) => {
        if (!ss) {
          ss = {
            favorites: []
          };
        }

        ss.favorites = ss.favorites.filter((f) => f.name !== name);

        ss.favorites.push({
          name: name,
          value: this.buildCurrent(),
          created_date: new Date()
        });
        return this.tablePrefsHttpService.save(key, ss);
      })
    );
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
            kind: TableActionKind.DELETE
          }
        )
      : null;

    this.isTableActionsSet = true;
  }

  private setTableObservable() {
    this.container$ = merge(
      timer(0), // To avoid ExpressionChangedAfterCheck
      this.contextHeaderService.currentContainerContext$.pipe(skip(1)),
      this.refreshSubject.asObservable().pipe(
        tap(() => {
          this.page = 1;
        })
      ),
      this.querySubject.asObservable().pipe(
        tap((searchModel: ISearchModel) => {
          this.searchBox = searchModel;
        })
      ),
      this.paginationSubject.asObservable().pipe(
        map((p: { page: number; per_page: number }) => ({
          page: p.page < 1 ? 1 : p.page,
          per_page: PER_PAGES.indexOf(p.per_page) ? p.per_page : 10
        })),
        distinctUntilChanged(),
        tap((p: { page: number; per_page: number }): void => {
          this.page = p.page;
          this.perPage = p.per_page;
        })
      ),
      this.facetSubject.asObservable().pipe(
        tap((facetModel: IFacetModel) => {
          this.facetBox = facetModel;
        })
      ),
      this.refreshGroupsSubject.asObservable().pipe(filter((elem) => elem)),
      this.refreshOpenModeSubject.asObservable().pipe(filter((elem) => elem)),
      this.translateService.onLangChange
    ).pipe(
      tap(() => (this.waiting = true)),
      concatMap(() =>
        forkJoin([this.getCurrentOpenMode(), this.getCurrentGroups()]).pipe(
          map(([openMode, groups]) => {
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
            return groups.length > 0
              ? this.createGroupsContainer(groups, 0, searchValue, filters, null, {
                  openMode,
                  perPage: this.perPage ?? 20
                })
              : this.createElementsContainer(searchValue, filters);
          })
        )
      ),
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
            () => {
              this.refreshSubject.next(true);
              this.popupService.showSuccess(this.options.crud.delete?.keys?.deleteSuccess ?? 'BASIC_CRUD.DELETE_SUCCESS');
            },
            () => {
              this.popupService.showError();
            }
          );
        }
      });
  }

  public exportElements(buttonRef: ElementRef): void {
    this.options.crud.export.exportCall(this.total, this.searchBox?.text ?? '', this.getFilters(), buttonRef);
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

  public getCurrentGroups(): Observable<IGroup[]> {
    return this.storage.get(this.storageGroupKey).pipe(
      catchError(() => of(null)),
      map((res) => res ?? []),
      map((old: IGroup[]) => {
        const keys = Object.keys(this.options.table.groupOptions);
        return old.filter((o) => keys.includes(o.key));
      })
    );
  }

  public getGroupSort(): Observable<string> {
    return this.getCurrentGroups().pipe(
      map((groups) =>
        groups.reduce((prev, group) => {
          const groupOption = this.options.table.groupOptions[group.key];
          return [prev, groupOption.sort(group.direction === GroupDirection.UP)].join(',');
        }, '')
      )
    );
  }

  doAddGroupKey(key: string): void {
    this.getCurrentGroups()
      .pipe(
        concatMap((groups) => {
          const group = groups.find((g) => g.key === key);
          if (group != null) {
            return EMPTY;
          }
          const groupOption = this.options.table.groupOptions[key];
          return this.storage.set(this.storageGroupKey, [...groups, { key, direction: GroupDirection.UP, nullsLast: groupOption.nulls_last }]);
        }),
        tap(() => {
          this.refreshGroupsSubject.next(true);
        })
      )
      .subscribe();
  }

  doToggleGroupDirection(key: string): void {
    this.getCurrentGroups()
      .pipe(
        concatMap((groups) => {
          const group = groups.find((g) => g.key === key);
          group.direction = group.direction === GroupDirection.UP ? GroupDirection.DOWN : GroupDirection.UP;
          group.nullsLast = !group.nullsLast;
          return this.storage.set(this.storageGroupKey, groups);
        }),
        tap(() => {
          this.refreshGroupsSubject.next(true);
        })
      )
      .subscribe();
  }

  doDeleteGroupKey(key: string): void {
    this.getCurrentGroups()
      .pipe(
        concatMap((groups) =>
          this.storage.set(
            this.storageGroupKey,
            groups.filter((g) => g.key !== key)
          )
        ),
        tap(() => {
          this.refreshGroupsSubject.next(true);
        })
      )
      .subscribe();
  }

  doToggleOpenMode(mode: 'first' | 'all' | 'close'): void {
    this.storage
      .set(this.storageOpenModeKey, mode)
      .pipe(tap(() => this.refreshOpenModeSubject.next(true)))
      .subscribe();
  }

  public doPage(page: number): void {
    this.paginationSubject.next({ page: page, per_page: this.perPage });
  }

  public doPerPage(perPage: number, container: IGroupsContainer): void {
    this.page = 1;
    this.perPage = perPage;
    this.paginationSubject.next({ page: 1, per_page: this.perPage });
  }

  private createGroupsContainer(
    groups: IGroup[],
    index: number,
    text: string,
    filters: any,
    sort: string,
    options: {
      openMode: OpenMode;
      perPage: number;
    }
  ): IElementsContainer<T> {
    const group = groups[index];
    const groupOption = this.options.table.groupOptions[group.key];

    const nextSubject = new Subject<boolean>();
    let total = 0;
    let page = this.page;
    let list: T[] = [];

    let previous: { page: number; total: number; results: T[]; next: (pageClicked: number) => void } = null;

    return {
      type: 'groups',
      nameKey: groupOption.nameKey,
      groups: timer(0).pipe(
        concatMap(() =>
          concat(
            iif(() => previous != null, of(false), of(true)),
            nextSubject.asObservable()
          ).pipe(
            switchMap((c) =>
              concat(
                of({
                  type: 'loading',
                  value: previous
                }),
                (c
                  ? this.options.table.searchByAxeCall(group.key, text.length < 3 ? '' : text, page, this.perPage ?? 20, filters, groupOption.sort(group.direction === GroupDirection.UP), group.nullsLast).pipe(
                      map((res) => {
                        total = Number(res.headers.get('X-Total'));
                        const totalPages = Number(res.headers.get('X-Total-Pages'));
                        this.totalPages = totalPages;
                        this.total = total;

                        list = res.body.map((b, i) => {
                          const fs = {
                            ...filters,
                            ...groupOption.filter(b._id)
                          };
                          return {
                            ...b,
                            name: groupOption.transform(b),
                            description: groupOption.transformDescription ? groupOption.transformDescription(b) : undefined,
                            group_value: groupOption.value,
                            open: options.openMode === 'first' ? page === 1 && i === 0 : options.openMode === 'all',
                            child:
                              groups.length > index + 1
                                ? this.createGroupsContainer(groups, index + 1, text, fs, sort, {
                                    openMode: options.openMode,
                                    perPage: options.perPage
                                  })
                                : this.createElementsContainer(text, fs, true),
                            elements: this.getGroupElements(text, fs, true),
                            filters: fs
                          } as T;
                        });

                        return {
                          page,
                          total,
                          results: list,
                          next: (item) => {
                            page = item.page;
                            if (this.perPage != item.per_page) {
                              // Refresh all groups bc of new per_page
                              this.refreshGroupsSubject.next(true);
                            } else {
                              nextSubject.next(true);
                            }
                            this.perPage = item.per_page;
                          }
                        };
                      }),
                      catchError(() => {
                        this.popupService.showError();
                        return of({
                          page,
                          total,
                          results: list,
                          next: undefined
                        });
                      }),
                      tap((res) => {
                        previous = res;
                      })
                    )
                  : of(previous)
                ).pipe(
                  map((res) => ({
                    type: 'idle',
                    value: res
                  }))
                )
              )
            )
          )
        )
      )
    };
  }

  private createElementsContainer(text: string, filters: any, isGroup: Boolean = false): IElementsContainer<T> {
    const nextSubject = new Subject<boolean>();
    let page = !isGroup ? this.page : 1;
    let total = 0;
    let list: T[] = [];

    let previous: { page: number; total: number; results: T[]; next: (pageClicked: number) => void } = null;

    return {
      type: 'elements',
      elements: timer(0).pipe(
        concatMap(() =>
          concat(
            iif(() => previous != null, of(false), of(true)),
            nextSubject.asObservable()
          ).pipe(
            switchMap((c) =>
              concat(
                of({
                  type: 'loading',
                  value: previous
                }),
                (c
                  ? this.options.table.searchCall(text, filters, page, this.perPage).pipe(
                      map((res) => {
                        total = Number(res.headers.get('X-Total'));
                        this.total = total;
                        const totalPages = Number(res.headers.get('X-Total-Pages'));
                        this.totalPages = totalPages;
                        list = res.body;

                        return {
                          page,
                          total,
                          results: list,
                          next: (item) => {
                            page = item.page;
                            if (this.perPage != item.per_page) {
                              // Refresh all groups bc of new per_page
                              this.refreshGroupsSubject.next(true);
                            } else {
                              nextSubject.next(true);
                            }
                            this.perPage = item.per_page;
                          }
                        };
                      }),
                      catchError(() => {
                        return of({
                          page,
                          total,
                          results: list,
                          next: undefined
                        });
                      }),
                      tap((res) => {
                        previous = res;
                      })
                    )
                  : of(previous)
                ).pipe(
                  map((res) => ({
                    type: 'idle',
                    value: res
                  }))
                )
              )
            )
          )
        )
      )
    };
  }

  private getGroupElements(text: string, filters: any, isGroup: Boolean = false): IElementsContainer<T> {
    const nextSubject = new Subject<boolean>();
    let page = !isGroup ? this.page : 1;
    let total = 0;
    let list: T[] = [];

    let previous: { page: number; total: number; results: T[]; next: (pageClicked: number) => void } = null;

    return {
      type: 'elements',
      elements: timer(0).pipe(
        concatMap(() =>
          concat(
            iif(() => previous != null, of(false), of(true)),
            nextSubject.asObservable()
          ).pipe(
            switchMap((c) =>
              concat(
                of({
                  type: 'loading',
                  value: previous
                }),
                (c
                  ? this.options.table.searchCall(text, filters, page, this.perPage).pipe(
                      map((res) => {
                        total = Number(res.headers.get('X-Total'));
                        this.total = total;
                        const totalPages = Number(res.headers.get('X-Total-Pages'));
                        this.totalPages = totalPages;
                        list = res.body;

                        return {
                          page,
                          total,
                          results: list,
                          next:
                            page < totalPages
                              ? () => {
                                  page++;
                                  nextSubject.next(true);
                                }
                              : undefined
                        };
                      }),
                      catchError(() => {
                        return of({
                          page,
                          total,
                          results: list,
                          next: undefined
                        });
                      }),
                      tap((res) => {
                        previous = res;
                      })
                    )
                  : of(previous)
                ).pipe(
                  map((res) => ({
                    type: 'idle',
                    value: res
                  }))
                )
              )
            )
          )
        )
      )
    };
  }

  private getCurrentColumns(): Observable<{ key: string; visible: boolean }[]> {
    return this.storage.get(this.storageGroupKey).pipe(
      catchError(() => of(null)),
      map((res) => res ?? []),
      map((old: { key: string; visible: boolean }[]) => {
        const ds = Object.keys(this.options.table.tableOptions.columns.columnsConfig).map((k) => ({
          key: k,
          visible: true
        }));
        const list = lodash.intersectionBy(old, (l) => l.key);
        return list.concat(lodash.differenceBy(ds, list, (l) => l.key));
      })
    );
  }

  private getCurrentOpenMode(): Observable<OpenMode> {
    return this.storage.get(this.storageOpenModeKey).pipe(
      catchError(() => of(null)),
      map((res) => res ?? 'all')
    );
  }

  doToggleSelect(items: T[], forceSelect: boolean = false, shiftKey: boolean = false): void {
    this.selectEvent.emit({
      items,
      forceSelect,
      shiftKey
    });
  }
}
