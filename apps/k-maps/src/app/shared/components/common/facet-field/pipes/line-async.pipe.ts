import { Pipe, PipeTransform } from '@angular/core';
import { ICategoryStandardConfig } from '../facet-options';
import { Observable } from 'rxjs/internal/Observable';
import { ICategoryLineModel } from '../facet-model';

@Pipe({
  name: 'lineAsync'
})
export class McitLineAsyncPipe implements PipeTransform {
  transform(value: ICategoryLineModel, key: string, config: ICategoryStandardConfig): Observable<string> {
    if (key == null || config == null) {
      return null;
    }
    return config.standard.async.value(value, key);
  }
}
