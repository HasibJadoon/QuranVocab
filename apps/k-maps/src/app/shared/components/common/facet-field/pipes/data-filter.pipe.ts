import { Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';
import { FacetModel, ICategoryLineModel } from '../facet-model';
import { ICategoryStandardConfig, StandardCategorySubType } from '../facet-options';
import { Observable } from 'rxjs/internal/Observable';
import { from, of } from 'rxjs';
import { concatMap, filter, map, startWith, toArray } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'datafilter'
})
export class McitDataFilterPipe implements PipeTransform {
  constructor(private translateService: TranslateService) {}

  transform(value: ICategoryLineModel[], search: string, config: ICategoryStandardConfig, selected: FacetModel[], key: string): Observable<ICategoryLineModel[]> {
    const equal = config.isSelected != null ? config.isSelected : lodash.isEqual;

    let newValue: ICategoryLineModel[] = value;

    if (selected?.length > 0) {
      newValue = [
        ...lodash.sortBy(
          selected.map((s) => ({
            _id: s,
            count: value?.find((v) => equal(s, v._id))?.count ?? 0
          })),
          (s) => -s.count
        ),
        ...(value?.filter((v) => !selected?.some((s) => equal(s, v._id))) ?? [])
      ];
    }

    if (!newValue || !search) {
      return of(newValue);
    }

    const regex = new RegExp(lodash.escapeRegExp(search), 'i');

    switch (config.standard?.sub_type) {
      case StandardCategorySubType.LISTDICO:
        return this.translateService.onLangChange.pipe(
          map((event) => event.lang),
          startWith(this.translateService.currentLang),
          map((lang) => newValue.filter((v) => this.getStringValue(v?._id, config.standard.listdico.prefixKey, config.standard.listdico.forceUpperCase, lang)?.match(regex)))
        );
      case StandardCategorySubType.ASYNC:
        return from(newValue).pipe(
          concatMap((v) =>
            config.standard.async.value(v, key).pipe(
              map((text) => (text?.match(regex) ? v : null)),
              filter((r) => r != null)
            )
          ),
          toArray()
        );
      default:
        return of(newValue.filter((v) => v?._id?.match(regex)));
    }
  }

  private getStringValue(value: string, prefix: string, forceUpperCase: boolean, lang: string): string {
    if (value == null) {
      return value;
    }
    return (forceUpperCase != null && forceUpperCase ? value.toUpperCase() : value)
      .split(',')
      .map((v) => (prefix ? this.translateService.instant(`${prefix}.${v}`) : v))
      .join(' | ');
  }
}
