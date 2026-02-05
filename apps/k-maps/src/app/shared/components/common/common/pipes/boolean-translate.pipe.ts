import { ChangeDetectorRef, Pipe, PipeTransform } from '@angular/core';
import * as lodash from 'lodash';
import { McitCurrencyService } from '../../services/currency.service';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'booleanTranslate'
})
export class McitBooleanTranslatePipe implements PipeTransform {
  constructor(private translateService: TranslateService) {}

  transform(bool: boolean): any {
    return lodash.isBoolean(bool) ? (bool ? this.translateService.instant('COMMON.TRUE') : this.translateService.instant('COMMON.FALSE')) : null;
  }
}
