import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'chatFirstUpercase'
})
export class McitChatFirstUpercasePipe implements PipeTransform {
  constructor() {}

  transform(day: string): string {
    if (day) {
      return day[0].toUpperCase() + day.slice(1);
    }
    return '';
  }
}
