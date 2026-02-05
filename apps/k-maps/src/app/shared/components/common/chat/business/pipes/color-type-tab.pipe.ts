import { Pipe, PipeTransform } from '@angular/core';
import { ChatMessageType } from '../domains/chat-message-type.domain';

@Pipe({
  name: 'colorTypeTab'
})
export class McitColorTypeTabPipe implements PipeTransform {
  constructor() {}

  transform(type: string, active?: boolean): string {
    const suffix = active ? 'active' : 'inactive';
    switch (type) {
      case ChatMessageType.REFUELING:
        return 'fuel-' + suffix;
      case ChatMessageType.WORKSHOP:
        return 'workshop-' + suffix;
      case ChatMessageType.HUMAN_RESOURCE:
        return 'human_resource-' + suffix;
      case ChatMessageType.TRANSPORT:
      default:
        return 'transport-' + suffix;
    }
  }
}
