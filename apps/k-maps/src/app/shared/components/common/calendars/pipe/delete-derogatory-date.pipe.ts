import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'equalDate'
})
export class EqualDatePipe implements PipeTransform {
  transform(derogatoryDate: Date, date: Date): boolean {
    if (!derogatoryDate) {
      return true;
    }
    return derogatoryDate === date;
  }
}
