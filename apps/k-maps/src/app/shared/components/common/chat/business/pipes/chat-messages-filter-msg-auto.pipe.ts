import { Pipe, PipeTransform } from '@angular/core';
import { IChatMessage } from '@lib-shared/common/chat/business/model/chat-message.model';

@Pipe({
  name: 'chatMessagesFilterMsgAuto'
})
export class McitChatMessagesFilterMsgAutoPipe implements PipeTransform {
  constructor() {}

  transform(messages: IChatMessage[], withMsgAuto: boolean): IChatMessage[] {
    return messages?.filter((msg) => (withMsgAuto ? true : !msg?.event));
  }
}
