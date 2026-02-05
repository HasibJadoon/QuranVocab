import { OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { DateTime } from 'luxon';

@Pipe({
  name: 'durationDay',
  pure: false
})
export class McitDurationDay implements PipeTransform {
  transform(value: string, firstDate: string): number {
    if (!value || !firstDate) {
      return null;
    }
    const d1 = DateTime.fromISO(value);
    const d2 = DateTime.fromISO(firstDate);
    return Math.floor(d1.diff(d2, 'days').days);
  }
}
