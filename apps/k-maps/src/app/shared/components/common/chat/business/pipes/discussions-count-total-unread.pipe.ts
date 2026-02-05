import { Pipe, PipeTransform } from '@angular/core';
import { IChatDiscussion } from '../model/chat-discussion.model';
import { ChatActorFrom } from '@lib-shared/common/chat/business/domains/chat-actor.domain';

@Pipe({
  name: 'countTotalUnread',
  pure: true
})
export class McitDiscussionsCountTotalUnreadPipe implements PipeTransform {
  transform(discussions: IChatDiscussion[], receiveFrom: ChatActorFrom): number {
    return (
      discussions
        ?.filter((discussion) => discussion?.unread_messages?.length)
        ?.map((discussion) => discussion?.unread_messages?.filter((unreadMsg) => unreadMsg?.sent_from !== receiveFrom))
        ?.reduce((acc, cur) => acc + cur?.reduce((acc1, cur1) => acc1 + cur1?.total, 0), 0) ?? 0
    );
  }
}
