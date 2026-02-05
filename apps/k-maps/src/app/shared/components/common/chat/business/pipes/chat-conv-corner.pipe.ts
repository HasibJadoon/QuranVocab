import { Pipe, PipeTransform } from '@angular/core';
import { User } from '../../../auth/models/user.model';
import { IChatMessage } from '../model/chat-message.model';
import { ChatMessageType } from '../domains/chat-message-type.domain';
import { ChatActorFrom } from '@lib-shared/common/chat/business/domains/chat-actor.domain';

@Pipe({
  name: 'chatConvCorner'
})
export class McitChatConvCornerPipe implements PipeTransform {
  constructor() {}

  transform(chatMessage: IChatMessage, sentFrom: ChatActorFrom): string {
    if (chatMessage?.sender?.sent_from === sentFrom) {
      const baseMr = 'mr-20 ';

      switch (chatMessage?.type) {
        case ChatMessageType.REFUELING:
          return baseMr + 'corner corner-me corner-me-fuel';
        case ChatMessageType.WORKSHOP:
          return baseMr + 'corner corner-me corner-me-workshop';
        case ChatMessageType.HUMAN_RESOURCE:
          return baseMr + 'corner corner-me corner-me-human_resource';
        case ChatMessageType.TRANSPORT:
        default:
          return baseMr + 'corner corner-me corner-me-transport';
      }
    } else {
      const baseMl = 'ml-20 ';
      switch (chatMessage?.type) {
        case ChatMessageType.REFUELING:
          return baseMl + 'corner corner-other corner-other-fuel';
        case ChatMessageType.WORKSHOP:
          return baseMl + 'corner corner-other corner-other-workshop';
        case ChatMessageType.HUMAN_RESOURCE:
          return baseMl + 'corner corner-other corner-other-human_resource';
        case ChatMessageType.TRANSPORT:
        default:
          return baseMl + 'corner corner-other corner-other-transport';
      }
    }
  }
}
