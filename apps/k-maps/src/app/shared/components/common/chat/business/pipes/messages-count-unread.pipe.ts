import { Pipe, PipeTransform } from '@angular/core';
import { IChatDiscussion, IUnRead } from '../model/chat-discussion.model';
import { ChatActorFrom } from '@lib-shared/common/chat/business/domains/chat-actor.domain';
import { ChatMessageType } from '@lib-shared/common/chat/business/domains/chat-message-type.domain';

@Pipe({
  name: 'countUnreadMessagesTotal',
  pure: true
})
export class McitCountUnreadMessagesTotalPipe implements PipeTransform {
  transform(unreadMessages: IUnRead[], receiveFrom: ChatActorFrom, msgType?: ChatMessageType): number {
    return (
      (unreadMessages ?? [])
        .filter((unreadMsg) => unreadMsg?.sent_from !== receiveFrom)
        .filter((unreadMsg) => (msgType?.length ? unreadMsg.msg_type === msgType : true))
        .map((unreadMsg) => unreadMsg.total)
        .reduce((acc, cur) => acc + cur, 0) ?? 0
    );
  }
}
