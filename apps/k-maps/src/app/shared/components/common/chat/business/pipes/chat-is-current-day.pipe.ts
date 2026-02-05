import { Pipe, PipeTransform } from '@angular/core';
import { IChatMessage } from '../model/chat-message.model';
import { DateTime } from 'luxon';
import { isSameDay } from '../../../helpers/date.helper';

@Pipe({
  name: 'chatIsCurrentDay'
})
export class McitChatIsCurrentDayPipe implements PipeTransform {
  constructor() {}

  transform(messages: IChatMessage[], index: number): boolean {
    const messageCreatedDate = DateTime.fromJSDate(new Date(messages[index]?.created_date));
    if (index === 0) {
      return isSameDay(messageCreatedDate);
    }

    const prevMessageCreatedDate = DateTime.fromJSDate(new Date(messages[index - 1]?.created_date));
    if (!isSameDay(messageCreatedDate, prevMessageCreatedDate)) {
      return isSameDay(messageCreatedDate);
    }
    return false;
  }
}
