import { Pipe, PipeTransform } from '@angular/core';
import { ILastMessage } from '../model/chat-discussion.model';
import * as lodash from 'lodash';

@Pipe({
  name: 'discussionsLastMessageEvent',
  pure: true
})
export class McitDiscussionsLastMessageEventPipe implements PipeTransform {
  transform(lastMessages: ILastMessage[]): ILastMessage {
    return lodash.last(
      lodash.sortBy(
        lastMessages?.filter((lastMessage) => !!lastMessage?.event),
        'created_date'
      )
    );
  }
}
