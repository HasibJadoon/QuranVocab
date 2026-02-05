import { Pipe, PipeTransform } from '@angular/core';
import { ChatAutomaticEvent } from '../domains/chat-messages-auto.domain';
import { IChatMessage } from '../model/chat-message.model';

@Pipe({
  name: 'chatMessageAuto'
})
export class McitChatMessageAutoPipe implements PipeTransform {
  constructor() {}

  transform(chatMessage: IChatMessage): boolean {
    return [ChatAutomaticEvent.DELETE_ACCOUNT, ChatAutomaticEvent.UNGROUP].includes(chatMessage?.event?.type);
  }
}
