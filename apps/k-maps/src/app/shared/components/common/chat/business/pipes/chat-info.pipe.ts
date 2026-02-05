import { Pipe, PipeTransform } from '@angular/core';
import { IChatMessage } from '../model/chat-message.model';
import { User } from '../../../auth/models/user.model';

@Pipe({
  name: 'chatInfo'
})
export class McitChatInfoPipe implements PipeTransform {
  constructor() {}

  transform(value: IChatMessage, user: User): string {
    if (value.created_by === user.username) {
      return 'ml-auto';
    }
    return '';
  }
}
