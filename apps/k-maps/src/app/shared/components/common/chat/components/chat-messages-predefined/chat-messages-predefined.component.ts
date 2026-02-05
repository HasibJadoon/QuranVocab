import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';

@TraceErrorClass()
@Component({
  selector: 'mcit-chat-messages-predefined',
  templateUrl: './chat-messages-predefined.component.html',
  styleUrls: ['./chat-messages-predefined.component.scss']
})
export class McitChatMessagesPredefinedComponent {
  @Input()
  isDriver = false;

  @Output() messagePredefinedEvent = new EventEmitter<any>();

  predefinedMessages: string[] = [
    'CARRIER.RECEIVED',
    'CARRIER.WAIT_30',
    'CARRIER.WAIT_10',
    'CARRIER.OFFICE',
    'CARRIER.ENABLE_GEOLOCALISATION',
    'DRIVER.DEALER_CLOSED',
    'DRIVER.DEALER_UNREACHABLE',
    'DRIVER.CAR_NOT_READY',
    'DRIVER.TRAFFIC_JAMS'
  ];

  constructor() {}

  chooseMessage(element: HTMLElement): void {
    this.messagePredefinedEvent.emit(element.outerText);
  }
}
