import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'durationFormat'
})
export class McitDurationFormatPipe implements PipeTransform {
  transform(duration: number): string {
    let result = '0m';
    if (duration) {
      const h = Math.floor(duration / 3600);
      const m = Math.floor((duration % 3600) / 60);
      result = (h > 0 ? h.toString() + 'h' : '') + (m > 0 ? m.toString() + 'm' : '');
    }
    return result;
  }
}
