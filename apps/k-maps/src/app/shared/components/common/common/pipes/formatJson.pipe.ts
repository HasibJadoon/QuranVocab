import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'mcitFormatJson'
})
export class McitFormatJsonPipe implements PipeTransform {
  transform(value: string): string {
    if (value == null) {
      return null;
    }
    return JSON.stringify(JSON.parse(value), null, 2);
  }
}
