import { Pipe, PipeTransform } from '@angular/core';
import { IChatDiscussion, IUnRead } from '../model/chat-discussion.model';
import { ChatActorFrom } from '@lib-shared/common/chat/business/domains/chat-actor.domain';
import { ChatMessageType } from '@lib-shared/common/chat/business/domains/chat-message-type.domain';
import { User } from '@lib-shared/common/auth/models/user.model';

@Pipe({
  name: 'countUnread',
  pure: true
})
export class McitDiscussionsCountUnreadPipe implements PipeTransform {
  transform(discussions: IChatDiscussion[], receiveFrom: ChatActorFrom, msgTypes?: ChatMessageType[]): number {
    return discussions
      ?.filter((discussion) => discussion?.unread_messages?.length)
      ?.filter((discussion) => discussion?.unread_messages.filter((unreadMsg) => unreadMsg?.sent_from !== receiveFrom).filter((unreadMsg) => (msgTypes?.length > 0 ? msgTypes.includes(unreadMsg.msg_type) : true))?.length > 0)?.length;
  }
}
