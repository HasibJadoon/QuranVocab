import { ChangeDetectorRef, Injectable } from '@angular/core';
import { McitPopupService } from '../services/popup.service';
import { merge, Observable, of, Subject, timer } from 'rxjs';
import { ISearchModel } from '../search/search-model';
import { catchError, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';
import * as lodash from 'lodash';
import { ISearchOptions } from '../search/search-options';

export class SearchAll<E> {
  readonly querySubject = new Subject<ISearchModel>();
  readonly sortSubject = new Subject<string>();
  readonly refreshSubject: Subject<boolean> = new Subject<boolean>();

  readonly result$: Observable<E[]> = merge(
    timer(0, this.options.autoRefresh?.time).pipe(map(() => true)),
    this.querySubject.asObservable().pipe(map(() => true)),
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
          lodash.omitBy(
            {
              ...filters
            },
            lodash.isNil
          ),
          this.sort
        )
        .pipe(
          map((res) => res),
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

  total: number;
  totalPages: number;
  sort: string;

  waiting = false;

  get searchOptions(): ISearchOptions {
    return this.options.searchOptions;
  }

  constructor(private popupService: McitPopupService, private options: ISearchAllOptions<E>) {
    this.sort = options.sort || '';
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

export interface ISearchAllOptions<E> {
  searchOptions: ISearchOptions;
  searchFn: (q: string, filters: any, sort: string) => Observable<E[]>;
  autoRefresh?: {
    enable: boolean;
    time: number;
  };
  sort?: string;
  changeDetectorRef?: ChangeDetectorRef;
}

@Injectable()
export class McitSearchAllBuilder {
  constructor(private popupService: McitPopupService) {}

  build<E>(options: ISearchAllOptions<E>): SearchAll<E> {
    return new SearchAll<E>(this.popupService, options);
  }
}
