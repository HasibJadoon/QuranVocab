import { Pipe, PipeTransform } from '@angular/core';
import { CategoryVisibility, ISettingsModel } from '../facet-model';
import { ICategoryConfig } from '../facet-options';

@Pipe({
  name: 'isOpenCategory'
})
export class McitIsOpenCategoryPipe implements PipeTransform {
  transform(key: string, config: ICategoryConfig, settings: ISettingsModel): boolean {
    if (settings?.categories?.[key]?.visibility != null) {
      return settings.categories[key].visibility === CategoryVisibility.OPEN;
    }
    return !config.defaultClose;
  }
}
