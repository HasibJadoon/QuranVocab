import { Pipe, PipeTransform } from '@angular/core';
import { IChatActor, IChatDiscussion } from '@lib-shared/common/chat/business/model/chat-discussion.model';
import { ChatActorFrom } from '@lib-shared/common/chat/business/domains/chat-actor.domain';

@Pipe({
  name: 'chatFindDriverActor'
})
export class McitChatFindDriverActorPipe implements PipeTransform {
  constructor() {}

  transform(discussion: IChatDiscussion): IChatActor {
    return discussion?.group?.find((actor) => actor?.from === ChatActorFrom.MOVEECAR_DRIVER);
  }
}
