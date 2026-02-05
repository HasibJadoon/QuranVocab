import { Pipe, PipeTransform } from '@angular/core';
import { IChatDiscussion } from '@lib-shared/common/chat/business/model/chat-discussion.model';
import { ChatMessageType } from '@lib-shared/common/chat/business/domains/chat-message-type.domain';

@Pipe({
  name: 'filterMsgType'
})
export class McitFilterMsgTypePipe implements PipeTransform {
  constructor() {}

  transform(discussions: IChatDiscussion[], msgType: ChatMessageType): IChatDiscussion[] {
    return discussions.filter((discussion) => discussion?.key?.msg_type === msgType);
  }
}
