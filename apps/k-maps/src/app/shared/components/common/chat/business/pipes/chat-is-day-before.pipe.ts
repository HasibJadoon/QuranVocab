import { Pipe, PipeTransform } from '@angular/core';
import { IChatMessage } from '../model/chat-message.model';
import { DateTime } from 'luxon';
import { isPreviousDay, isSameDay } from '../../../helpers/date.helper';

@Pipe({
  name: 'chatIsDayBefore'
})
export class McitChatIsDayBeforePipe implements PipeTransform {
  constructor() {}

  transform(messages: IChatMessage[], index: number): boolean {
    if (index === 0) {
      return isPreviousDay(DateTime.fromJSDate(messages[index]?.created_date));
    }

    if (!isSameDay(DateTime.fromJSDate(messages[index]?.created_date), DateTime.fromJSDate(messages[index - 1]?.created_date))) {
      return isPreviousDay(DateTime.fromJSDate(messages[index]?.created_date));
    }
    return false;
  }
}
