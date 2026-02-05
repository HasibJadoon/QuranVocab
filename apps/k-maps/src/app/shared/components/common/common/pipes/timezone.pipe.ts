import { Pipe, PipeTransform } from '@angular/core';
import { timezoneForDatePipe } from '../../helpers/date.helper';

@Pipe({
  name: 'timezone'
})
export class McitTimezonePipe implements PipeTransform {
  transform(value: any, ...args: any[]): any {
    return timezoneForDatePipe(value);
  }
}
