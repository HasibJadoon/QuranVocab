import { Pipe, PipeTransform } from '@angular/core';
import { of, Observable } from 'rxjs';

@Pipe({
  name: 'toObservable'
})
export class McitToObservablePipe implements PipeTransform {
  transform<T>(value: T): Observable<T> {
    return of(value);
  }
}
