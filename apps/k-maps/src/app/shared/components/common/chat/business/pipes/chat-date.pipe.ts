import { Pipe, PipeTransform } from '@angular/core';
import { IChatMessage } from '../model/chat-message.model';
import { DateTime } from 'luxon';
import { isSameDay, isPreviousDay } from '../../../helpers/date.helper';

@Pipe({
  name: 'chatDate'
})
export class McitChatDatePipe implements PipeTransform {
  constructor() {}

  transform(messages: IChatMessage[], index: number): boolean {
    const messageCreatedDate = DateTime.fromJSDate(new Date(messages[index].created_date));
    if (index === 0 && !isSameDay(messageCreatedDate) && !isPreviousDay(messageCreatedDate)) {
      return true;
    }

    if (isSameDay(messageCreatedDate) || isPreviousDay(messageCreatedDate)) {
      return false;
    }

    const prevMessageCreatedDate = DateTime.fromJSDate(new Date(messages[index - 1].created_date));
    return !isSameDay(messageCreatedDate, prevMessageCreatedDate);
  }
}
