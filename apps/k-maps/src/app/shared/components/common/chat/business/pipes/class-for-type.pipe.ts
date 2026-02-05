import { Pipe, PipeTransform } from '@angular/core';
import { ChatMessageType } from '../domains/chat-message-type.domain';

@Pipe({
  name: 'chatForType'
})
export class McitClassForTypePipe implements PipeTransform {
  constructor() {}

  transform(type: ChatMessageType, xlSize?: boolean): string {
    switch (type) {
      case ChatMessageType.TRANSPORT:
        return `fa-solid fa-truck ${xlSize ? 'fa-xl' : ''} transport-icon`;
      case ChatMessageType.REFUELING:
        return `fa-solid fa-gas-pump ${xlSize ? 'fa-xl' : ''} fuel-icon`;
      case ChatMessageType.WORKSHOP:
        return `fa-solid fa-car-wrench ${xlSize ? 'fa-xl' : ''} workshop-icon`;
      case ChatMessageType.HUMAN_RESOURCE:
        return `fa-solid fa-handshake ${xlSize ? 'fa-xl' : ''} human_resource-icon`;
    }

    return '';
  }
}
