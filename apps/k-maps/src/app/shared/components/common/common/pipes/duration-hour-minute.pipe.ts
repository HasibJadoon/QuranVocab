import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'mcitDurationHourMinute'
})
export class McitDurationHourMinutePipe implements PipeTransform {
  transform(value: number): string {
    if (value == null) {
      return '';
    }
    const hours = Math.floor(value);
    value = (value - hours) * 60;
    const minutes = Math.floor(value);
    return [hours ? `${hours}h` : '', minutes ? `${minutes}m` : ''].filter((s) => s !== '').join(' ');
  }
}
