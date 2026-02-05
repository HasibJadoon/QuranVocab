import { Pipe, PipeTransform } from '@angular/core';
import { Duration } from 'luxon';

@Pipe({
  name: 'mcitLuxonDuration'
})
export class McitLuxonDurationPipe implements PipeTransform {
  transform(value: number, format: string): string {
    if (value == null) {
      return null;
    }
    return Duration.fromMillis(value).toFormat(format);
  }
}
