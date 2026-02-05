import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { merge, Observable, of, Subject, timer } from 'rxjs';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { PopUpKind } from './pop-up-kind.domain';
import { McitDialog } from '../dialog/dialog.service';
import { ISearchOptions } from '../search/search-options';
import { ISearchModel } from '../search/search-model';
import { User } from '../auth/models/user.model';
import { McitSearchService } from '../search/search.service';
import { McitQuestionModalService } from '../question-modal/question-modal.service';
import { McitPopupService } from '../services/popup.service';
import { PER_PAGE, PER_PAGES } from '../helpers/pagination.helper';
import * as _ from 'lodash';
import { McitAceEditorModalService } from '../ace-editor-modal/ace-editor-modal.service';
import { McitInfoTracableModalService } from '../info-tracable-modal/info-tracable-modal.service';
import { IFacetDataModel, IFacetModel } from '../facet-field/facet-model';
import { IFacetOptions } from '../facet-field/facet-options';
import { McitFacetService } from '../facet-field/facet.service';
import { McitMultipleFiltersModalService } from '../multiple-filters-modal/multiple-filters-modal.service';
import { cloneDeep, isEqual, isNil } from 'lodash';
import { IMultipleFilters, IReferenceTypes } from '../multiple-filters-modal/multiple-filters-modal.component';

export abstract class McitBaseCrudAbstract<T> {
  // To implement
  // required
  public abstract searchOptions: ISearchOptions;
  protected abstract searchCall: (searchValue: string, filters: { [key: string]: any }) => Observable<HttpResponse<T[]>>;
  // optional
  protected viewComponent;
  protected upsertComponent;
  protected upsertKeys: {
    deleteSuccess: string;
    deleteTitle: string;
    deleteQuestion: string;
  };
  protected deleteCall: (element: any) => Observable<void>;
  protected modalSizesGeneric = 'modal-lg';
  protected modalSizes: {
    view?: string;
    add?: string;
    edit?: string;
    clone?: string;
    code?: string;
  } = {};
  protected filterFieldOnUpsert = 'code';
  public facetOptions: IFacetOptions;
  protected categoriesCall: (searchValue: string, filters: { [key: string]: any }) => Observable<IFacetDataModel | HttpResponse<IFacetDataModel>>;
  protected additionalFilters: { [key: string]: any } = {};
  public multipleFilters: IMultipleFilters;
  public multipleFiltersLength = 0;
  public referenceTypes: IReferenceTypes;

  // Pagination
  public perPage: number;
  public page: number;
  public total: number;
  public totalPages: number;
  public paginationSubject = new Subject<{ page: number; per_page: number }>();

  // Table
  public searchBox: ISearchModel;
  public waiting;
  public querySubject = new Subject<ISearchModel>();
  public elements$: Observable<T[]>;
  public refreshSubject: Subject<boolean> = new Subject<boolean>();

  // Facet
  public facetBox: IFacetModel;
  public waitingCategories;
  public facetSubject = new Subject<IFacetModel>();
  public categories$: Observable<IFacetDataModel>;

  // Rights & roles
  public user$: Observable<User>;

  constructor(
    public dialog: McitDialog,
    public router: Router,
    public route: ActivatedRoute,
    public popupService: McitPopupService,
    public translateService: TranslateService,
    public searchService: McitSearchService,
    public store: Store<any>,
    public mcitQuestionModalService?: McitQuestionModalService,
    public aceEditorModalService?: McitAceEditorModalService,
    public infoTracableModalService?: McitInfoTracableModalService,
    public facetService?: McitFacetService,
    public multipleFiltersModalService?: McitMultipleFiltersModalService
  ) {}

  public onInit(): void {
    // Get user
    this.user$ = this.store.select('user');

    // Init pagination
    this.page = this.route.snapshot.queryParams.page ? Number(this.route.snapshot.queryParams.page) : 1;
    this.perPage = this.route.snapshot.queryParams.per_page ? Number(this.route.snapshot.queryParams.per_page) : PER_PAGE;

    // Get search & facet model form query params
    this.searchBox = this.searchService.queryParamsToSearchModel(this.searchOptions, this.route.snapshot.queryParams);
    if (this.facetService) {
      this.facetBox = this.facetService.queryParamsToFacetModel(this.facetOptions, this.route.snapshot.queryParams);
    }

    // Table elements observable
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
          this.perPage = PER_PAGES.indexOf(p.per_page) ? p.per_page : PER_PAGE;
        })
      ),
      this.translateService.onLangChange
    ).pipe(
      tap(() => (this.waiting = true)),
      switchMap(() => {
        this.router.navigate(['./'], {
          relativeTo: this.route,
          queryParams: {
            page: this.page,
            per_page: this.perPage,
            ...this.searchService.searchModelToQueryParams(this.searchOptions, this.searchBox),
            ...(this.facetService ? this.facetService.facetModelToQueryParams(this.facetOptions, this.facetBox) : {}),
            ...this.additionalFilters
          },
          replaceUrl: true
        });
        const searchValue = this.searchBox?.text ?? '';
        const filters: { [key: string]: any } = this.getFilters();
        return this.searchCall(searchValue, filters).pipe(
          tap((res: HttpResponse<Array<any>>): void => {
            this.total = Number(res.headers.get('X-Total'));
            this.totalPages = Number(res.headers.get('X-Total-Pages'));
          }),
          map((res: HttpResponse<Array<any>>): Array<any> => res.body),
          catchError((err: HttpErrorResponse): Observable<Array<any>> => {
            this.popupService.showError();
            return of([]);
          })
        );
      }),
      tap(() => (this.waiting = false))
    );

    // Facet categories observable
    if (this.facetService) {
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
          return this.categoriesCall(searchValue, filters).pipe(
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
  }

  public doPage = (page: number): void => {
    this.paginationSubject.next({ page, per_page: this.perPage });
  };

  public doPerPage = (perPage: number): void => {
    this.paginationSubject.next({ page: 1, per_page: perPage });
  };

  public doOpenMultipleFilters = (): void => {
    const oldMultipleFilter = cloneDeep(this.multipleFilters);
    this.multipleFiltersModalService
      .showMultipleFilters(this.referenceTypes, this.multipleFilters)
      .pipe(filter((res) => !isNil(res)))
      .subscribe((next) => {
        if (isEqual(oldMultipleFilter, next)) {
          this.refreshSubject.next();
        } else {
          this.multipleFilters = next;
          this.multipleFiltersLength = Object.keys(this.multipleFilters).length;
          this.querySubject.next();
        }
      });
  };

  public clearMultipleFilters = (): void => {
    this.multipleFilters = {};
    this.multipleFiltersLength = 0;
    this.querySubject.next();
  };

  public doRefresh = (): void => {
    this.refreshSubject.next();
  };

  protected viewElement = (element: T): void => {
    if (this.viewComponent) {
      this.dialog.open(this.viewComponent, {
        dialogClass: this.modalSizes.view ?? this.modalSizesGeneric,
        data: {
          element
        }
      });
    } else {
      this.dialog.open(this.upsertComponent, {
        dialogClass: this.modalSizes.view ?? this.modalSizesGeneric,
        data: {
          element,
          popUpKind: PopUpKind.VIEW
        }
      });
    }
  };

  public addElement = (): void => {
    this.dialog
      .open(this.upsertComponent, {
        dialogClass: this.modalSizes.add ?? this.modalSizesGeneric,
        data: {
          popUpKind: PopUpKind.CREATE
        }
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.searchBox = {
            text: result[this.filterFieldOnUpsert]
          };
          this.refreshSubject.next(true);
        }
      });
  };

  protected editElement = (element: T): void => {
    this.dialog
      .open(this.upsertComponent, {
        dialogClass: this.modalSizes.edit ?? this.modalSizesGeneric,
        data: {
          element,
          popUpKind: PopUpKind.EDIT
        }
      })
      .afterClosed()
      .subscribe((edited) => {
        if (edited) {
          this.searchBox = {
            text: edited[this.filterFieldOnUpsert]
          };
          this.refreshSubject.next(true);
        }
      });
  };

  protected cloneElement = (element: T): void => {
    this.dialog
      .open(this.upsertComponent, {
        dialogClass: this.modalSizes.clone ?? this.modalSizesGeneric,
        data: {
          element,
          popUpKind: PopUpKind.CLONE
        }
      })
      .afterClosed()
      .subscribe((edited) => {
        if (edited) {
          this.searchBox = {
            text: edited[this.filterFieldOnUpsert]
          };
          this.refreshSubject.next(true);
        }
      });
  };

  protected codeElement = (element: T): void => {
    this.aceEditorModalService.open(_.get(element, 'code'), element);
  };

  protected infoElement = (element: T): void => {
    this.infoTracableModalService.open(_.get(element, 'code'), _.pick(element, ['created_date', 'created_by', 'updated_date', 'updated_by']));
  };

  protected deleteElement = (element: T): void => {
    this.mcitQuestionModalService.showQuestion(this.upsertKeys.deleteTitle, this.upsertKeys.deleteQuestion, 'COMMON.YES', 'COMMON.NO').subscribe((result) => {
      if (result) {
        this.deleteCall(element).subscribe(
          () => {
            this.refreshSubject.next(true);
            this.popupService.showSuccess(this.upsertKeys.deleteSuccess);
          },
          () => {
            this.popupService.showError();
          }
        );
      }
    });
  };

  private getFilters(): { [key: string]: string } {
    return {
      ...(this.searchBox?.filters ?? {}),
      ...(this.facetBox?.categories ?? {}),
      ...this.additionalFilters,
      ...this.buildMultipleFilters()
    };
  }

  private buildMultipleFilters(): any {
    return Object.keys(this.multipleFilters ?? {}).reduce((acc, x) => {
      acc[x] = this.multipleFilters[x].value;
      return acc;
    }, {});
  }
}
