import { Pipe, PipeTransform } from '@angular/core';
import { combineLatest, isObservable, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ICategoriesConfig } from '../facet-options';

@Pipe({
  name: 'categoriesDisable'
})
export class McitCategoriesDisablePipe implements PipeTransform {
  transform(categoriesConfig: ICategoriesConfig): Observable<ICategoriesConfig> {
    if (categoriesConfig == null) {
      return of(categoriesConfig);
    }

    const list = Object.keys(categoriesConfig).map((k) => {
      const disable = categoriesConfig[k].disable;

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

    return combineLatest(list).pipe(map((l) => l.filter((r) => r != null).reduce((acc, k) => ({ ...acc, [k]: categoriesConfig[k] }), {})));
  }
}
