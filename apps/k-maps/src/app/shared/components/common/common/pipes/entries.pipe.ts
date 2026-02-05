import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'entries'
})
export class McitEntriesPipe implements PipeTransform {
  transform(value: any, ...args: any[]): any {
    if (!value || !(value instanceof Object)) {
      return value;
    }
    const entries = [];
    for (const key of Object.keys(value)) {
      entries.push({ key, value: value[key] });
    }
    return entries;
  }
}
