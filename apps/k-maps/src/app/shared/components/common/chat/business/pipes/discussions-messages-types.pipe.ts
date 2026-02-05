import { Pipe, PipeTransform } from '@angular/core';
import { IChatDiscussion } from '../model/chat-discussion.model';
import { ChatActorFrom } from '@lib-shared/common/chat/business/domains/chat-actor.domain';
import { ChatMessageType } from '@lib-shared/common/chat/business/domains/chat-message-type.domain';

@Pipe({
  name: 'discussionsMessagesTypes',
  pure: true
})
export class McitDiscussionsMessagesTypesPipe implements PipeTransform {
  transform(discussions: IChatDiscussion[]): ChatMessageType[] {
    return discussions?.map((disc) => disc?.key?.msg_type);
  }
}
