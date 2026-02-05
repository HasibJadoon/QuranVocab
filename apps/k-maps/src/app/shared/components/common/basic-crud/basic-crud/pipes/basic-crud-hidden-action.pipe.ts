import { Pipe, PipeTransform } from '@angular/core';
import { isObservable, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Pipe({
  name: 'basicCrudHiddenAction'
})
export class BasicCrudHiddenActionPipe implements PipeTransform {
  transform(value: boolean | Observable<boolean>, defaultValue: boolean): Observable<boolean> {
    if (isObservable(value)) {
      return value.pipe(map((r) => !r));
    }
    return value != null ? of(!value) : of(defaultValue);
  }
}
