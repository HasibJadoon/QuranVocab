import { Pipe, PipeTransform } from '@angular/core';
import { IChatActor, IChatDiscussion } from '@lib-shared/common/chat/business/model/chat-discussion.model';
import { ChatActorFrom } from '@lib-shared/common/chat/business/domains/chat-actor.domain';

@Pipe({
  name: 'chatFindCarrierActor'
})
export class McitChatFindCarrierActorPipe implements PipeTransform {
  constructor() {}

  transform(discussion: IChatDiscussion): IChatActor {
    return discussion?.group?.find((actor) => actor?.from === ChatActorFrom.MOVEECAR_CARRIER);
  }
}
