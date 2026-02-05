import { ChangeDetectorRef, Injectable } from '@angular/core';
import { McitPopupService } from '../services/popup.service';
import { merge, Observable, of, Subject, timer } from 'rxjs';
import { ISearchModel } from '../search/search-model';
import { catchError, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';
import { PER_PAGES } from '../helpers/pagination.helper';
import * as lodash from 'lodash';
import { ISearchOptions } from '../search/search-options';
import { HttpResponse } from '@angular/common/http';

export class SearchPagination<E> {
  readonly querySubject = new Subject<ISearchModel>();
  readonly sortSubject = new Subject<string>();
  readonly paginationSubject = new Subject<{ page: number; per_page: number }>();
  readonly refreshSubject: Subject<boolean> = new Subject<boolean>();

  readonly result$: Observable<E[]> = merge(
    timer(0, this.options.autoRefresh?.time).pipe(map(() => true)),
    this.querySubject.asObservable().pipe(
      tap(() => (this.page = 1)),
      map(() => true)
    ),
    this.paginationSubject.asObservable().pipe(
      map((p) => ({
        page: p.page < 1 ? 1 : p.page,
        per_page: PER_PAGES.indexOf(p.per_page) ? p.per_page : 10
      })),
      distinctUntilChanged(),
      tap((p) => {
        this.page = p.page;
        this.per_page = p.per_page;
        if (this.options.changeDetectorRef) {
          this.options.changeDetectorRef.markForCheck();
        }
      }),
      map(() => true)
    ),
    this.sortSubject.asObservable().pipe(
      distinctUntilChanged(),
      map(() => true)
    ),
    this.refreshSubject.asObservable()
  ).pipe(
    filter((elem) => elem),
    tap(() => {
      this.waiting = true;
      if (this.options.changeDetectorRef) {
        this.options.changeDetectorRef.markForCheck();
      }
    }),
    switchMap(() => {
      const text = lodash.get(this.searchBox, 'text', '');
      const filters: any = lodash.get(this.searchBox, 'filters', {});

      return this.options
        .searchFn(
          text.length < 3 ? '' : text,
          this.page,
          this.per_page,
          lodash.omitBy(
            {
              ...filters
            },
            lodash.isNil
          ),
          this.sort
        )
        .pipe(
          tap((res) => {
            this.total = Number(res.headers.get('X-Total'));
            this.totalPages = Number(res.headers.get('X-Total-Pages'));
            if (this.options.changeDetectorRef) {
              this.options.changeDetectorRef.markForCheck();
            }
          }),
          map((res) => res.body),
          catchError((err) => {
            this.popupService.showError();
            return of([]);
          })
        );
    }),
    tap(() => {
      this.waiting = false;
      if (this.options.changeDetectorRef) {
        this.options.changeDetectorRef.markForCheck();
      }
    })
  );

  searchBox: ISearchModel;

  page = 1;
  total: number;
  totalPages: number;
  per_page = 10;
  sort: string;

  waiting = false;

  get searchOptions(): ISearchOptions {
    return this.options.searchOptions;
  }

  constructor(private popupService: McitPopupService, private options: ISearchPaginationOptions<E>) {
    this.page = options.pagination?.page || 1;
    this.per_page = options.pagination?.per_page || 10;
    this.sort = options.sort || '';
  }

  doPage(page: number): void {
    this.paginationSubject.next({ page, per_page: this.per_page });
  }

  doPerPage(per_page: number): void {
    this.paginationSubject.next({ page: 1, per_page });
  }

  doSort(sort: string): void {
    this.sortSubject.next(sort);
  }

  doQueryChange(): void {
    this.querySubject.next(this.searchBox);
  }

  doRefresh(): void {
    this.refreshSubject.next(true);
  }
}

export interface ISearchPaginationOptions<E> {
  searchOptions: ISearchOptions;
  searchFn: (q: string, page: number, per_page: number, filters: any, sort: string) => Observable<HttpResponse<E[]>>;
  autoRefresh?: {
    enable: boolean;
    time: number;
  };
  pagination?: {
    page?: number;
    per_page?: number;
  };
  sort?: string;
  changeDetectorRef?: ChangeDetectorRef;
}

@Injectable()
export class McitSearchPaginationBuilder {
  constructor(private popupService: McitPopupService) {}

  build<E>(options: ISearchPaginationOptions<E>): SearchPagination<E> {
    return new SearchPagination<E>(this.popupService, options);
  }
}
