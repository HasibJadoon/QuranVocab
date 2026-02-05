import { Pipe, PipeTransform } from '@angular/core';
import { ExecService } from '@business-fvl/models/work-order.model';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'execService',
  pure: false
})
export class McitExecServicePipe implements PipeTransform {
  constructor(private translateService: TranslateService) {}

  transform(value: ExecService): string {
    const mapExecService = {
      A: this.translateService.instant('EXEC_CENTER.WORKSHOP'),
      P: this.translateService.instant('EXEC_CENTER.PARK'),
      C: this.translateService.instant('EXEC_CENTER.CENTER')
    };
    return mapExecService[value] ?? '';
  }
}
