import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filtersnb',
  pure: true
})
export class McitFiltersNbPipe implements PipeTransform {
  transform(value: any, ...args: any[]): any {
    if (!value) {
      return 0;
    }
    const keys = Object.keys(value);
    if (keys.length === 0) {
      return 0;
    }
    const res = keys.filter((k) => value[k] || value[k] === 0);
    return res.length;
  }
}
