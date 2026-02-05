import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'toString'
})
export class McitToStringPipe implements PipeTransform {
  transform(value: any): any {
    return value?.toString();
  }
}
