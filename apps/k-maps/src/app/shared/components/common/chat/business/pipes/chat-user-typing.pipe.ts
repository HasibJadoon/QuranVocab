import { Pipe, PipeTransform } from '@angular/core';
import { ISocketIsTypingData } from '@lib-shared/common/chat/business/domains/socket-event-name.domain';

@Pipe({
  name: 'chatUserTyping'
})
export class McitChatUserTypingPipe implements PipeTransform {
  constructor() {}

  transform(dataTyping: ISocketIsTypingData): string {
    if (dataTyping?.user?.firstname && dataTyping?.user?.lastname) {
      return dataTyping?.user.firstname + ' ' + dataTyping?.user.lastname;
    }
    return dataTyping?.user?.email;
  }
}
