import { Pipe, PipeTransform } from '@angular/core';
import { combineLatest, isObservable, Observable, of } from 'rxjs';
import { IFiltersConfig } from '../search-options';
import { catchError, map } from 'rxjs/operators';

@Pipe({
  name: 'filtersDisable'
})
export class FiltersDisablePipe implements PipeTransform {
  transform(filtersConfig: IFiltersConfig): Observable<IFiltersConfig> {
    if (filtersConfig == null) {
      return of(filtersConfig);
    }

    const list = Object.keys(filtersConfig).map((k) => {
      const disable = filtersConfig[k].disable;

      if (disable == null) {
        return of(k);
      }

      if (isObservable(disable)) {
        return disable.pipe(
          catchError(() => {
            console.error(`Failed to disable ${k}`);
            return of(false);
          }),
          map((r) => (r ? null : k))
        );
      }
      return disable ? of(null) : of(k);
    });

    return combineLatest(list).pipe(map((l) => l.filter((r) => r != null).reduce((acc, k) => ({ ...acc, [k]: filtersConfig[k] }), {})));
  }
}
