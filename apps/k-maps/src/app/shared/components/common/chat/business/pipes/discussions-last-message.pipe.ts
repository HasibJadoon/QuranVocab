import { Pipe, PipeTransform } from '@angular/core';
import { ILastMessage } from '../model/chat-discussion.model';
import * as lodash from 'lodash';
import { ChatMessageType } from '@lib-shared/common/chat/business/domains/chat-message-type.domain';

@Pipe({
  name: 'discussionsLastMessage',
  pure: true
})
export class McitDiscussionsLastMessagePipe implements PipeTransform {
  transform(lastMessages: ILastMessage[], msgType: ChatMessageType): ILastMessage {
    return lodash.last(
      lodash.sortBy(
        lastMessages?.filter((lastMessage) => lastMessage.msg_type === msgType),
        'created_date'
      )
    );
  }
}
