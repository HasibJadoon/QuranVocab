import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'messagesPredefinedFilter',
  pure: true
})
export class McitMessagesPredefinedFilterPipe implements PipeTransform {
  transform(messages: string[], isDriver?: boolean): any {
    return messages.filter((message) => (isDriver ? message.startsWith('DRIVER') : message.startsWith('CARRIER')));
  }
}
