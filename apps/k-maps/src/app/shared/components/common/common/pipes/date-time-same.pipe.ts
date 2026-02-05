import { Pipe, PipeTransform } from '@angular/core';
import { DateTime, DateTimeUnit } from 'luxon';

@Pipe({
  name: 'datetimesame',
  pure: false
})
export class McitDateTimeSamePipe implements PipeTransform {
  transform(input: DateTime, target: DateTime, unit: DateTimeUnit): boolean {
    if (!input || !target) {
      return false;
    }
    return input.hasSame(target, unit);
  }
}
