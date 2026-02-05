import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'replaceFilterValue'
})
export class ReplaceFilterValuePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) {
      return value;
    }
    return value.replace(new RegExp('\\$', 'g'), '');
  }
}
