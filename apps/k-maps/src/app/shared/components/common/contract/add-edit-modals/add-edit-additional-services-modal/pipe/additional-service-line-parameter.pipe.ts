import { Pipe, PipeTransform } from '@angular/core';
import { IServiceLine } from '@lib-shared/common/contract/contract-version.model';
import { TranslateService } from '@ngx-translate/core';
import { isNumber } from 'lodash';

const libelleObject = {
  SERVICES_GRID: {
    name: 'COMMON_CONTRACTS.MODAL.VERSION.SERVICES_GRID_RESUME',
    param: (v: IServiceLine) => (isNumber(v.services_grid.lines) ? Object({ length: v.services_grid.lines, file_name: v.services_grid.file_name }) : null)
  }
};

@Pipe({ name: 'additionalservicelineparameter' })
export class AdditionalServiceLineParameterPipe implements PipeTransform {
  constructor(private readonly translateService: TranslateService) {}

  transform(value: IServiceLine): string {
    const builder = libelleObject[(value as IServiceLine).formula];
    if (builder?.param(value)) {
      return this.translateService.instant(builder.name, builder.param(value));
    }
    return null;
  }
}
