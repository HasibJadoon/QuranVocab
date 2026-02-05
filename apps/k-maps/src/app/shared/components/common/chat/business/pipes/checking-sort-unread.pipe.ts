import { Pipe, PipeTransform } from '@angular/core';
import { IChatDiscussion, IUnRead, SortMessageType } from '../model/chat-discussion.model';
import { ChatActorFrom } from '@lib-shared/common/chat/business/domains/chat-actor.domain';
import { ChatMessageType } from '@lib-shared/common/chat/business/domains/chat-message-type.domain';

@Pipe({
  name: 'checkingSortUnread',
  pure: true
})
export class McitSortUnreadPipe implements PipeTransform {
  transform(discussions: IChatDiscussion[], sortType: SortMessageType): IChatDiscussion[] {
    return sortType === SortMessageType.UNREAD_ON_TOP
      ? (discussions ?? []).sort(
          (a, b) =>
            Math.max(...b.unread_messages.filter((unreadMsg) => unreadMsg?.sent_from !== ChatActorFrom.MOVEECAR_CARRIER).map((o) => o.total)) -
            Math.max(...a.unread_messages.filter((unreadMsg) => unreadMsg?.sent_from !== ChatActorFrom.MOVEECAR_CARRIER).map((o) => o.total))
        )
      : discussions;
  }
}
