import { Pipe, PipeTransform } from '@angular/core';
import { User } from '../../../auth/models/user.model';
import { IChatMessage } from '../model/chat-message.model';
import { ChatMessageType } from '../domains/chat-message-type.domain';
import { ChatActorFrom } from '@lib-shared/common/chat/business/domains/chat-actor.domain';

@Pipe({
  name: 'chatConv'
})
export class McitChatConvPipe implements PipeTransform {
  constructor() {}

  transform(chatMessage: IChatMessage, sentFrom: ChatActorFrom): string {
    if (chatMessage?.sender?.sent_from === sentFrom) {
      const baseStyleMe = 'rounded p-2 mr-40 ml-auto';

      switch (chatMessage?.type) {
        case ChatMessageType.REFUELING:
          return 'fuel-me ' + baseStyleMe;
        case ChatMessageType.WORKSHOP:
          return 'workshop-me ' + baseStyleMe;
        case ChatMessageType.HUMAN_RESOURCE:
          return 'human_resource-me ' + baseStyleMe;
        case ChatMessageType.TRANSPORT:
        default:
          return 'transport-me ' + baseStyleMe;
      }
    } else {
      const baseStyleOther = 'rounded p-2 ml-40';

      switch (chatMessage?.type) {
        case ChatMessageType.REFUELING:
          return 'fuel-other ' + baseStyleOther;
        case ChatMessageType.WORKSHOP:
          return 'workshop-other ' + baseStyleOther;
        case ChatMessageType.HUMAN_RESOURCE:
          return 'human_resource-other ' + baseStyleOther;
        case ChatMessageType.TRANSPORT:
        default:
          return 'transport-other ' + baseStyleOther;
      }
    }
  }
}
