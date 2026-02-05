import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'mcitDurationDayHourMinuteSecond'
})
export class McitDurationDayHourMinuteSecondPipe implements PipeTransform {
  transform(value: number): string {
    if (value == null) {
      return '';
    }
    const days = Math.floor(value);
    value = (value - days) * 24;
    const hours = Math.floor(value);
    value = (value - hours) * 60;
    const minutes = Math.floor(value);
    value = (value - minutes) * 60;
    const seconds = Math.floor(value);
    return [days ? `${days}d` : '', hours ? `${hours}h` : '', minutes ? `${minutes}m` : '', seconds ? `${seconds}s` : ''].filter((s) => s !== '').join(':');
  }
}
