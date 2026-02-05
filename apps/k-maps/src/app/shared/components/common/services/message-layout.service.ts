import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class McitMessageLayoutService {
  private id = 0;
  private messages: McitMessageLayout[] = [];
  private messagesSubject = new BehaviorSubject<McitMessageLayout[]>(null);

  constructor() {}

  messages$(): Observable<McitMessageLayout[]> {
    return this.messagesSubject.asObservable();
  }

  addMessage(message: McitMessageLayout): McitMessageLayout {
    if (!message) {
      return;
    }
    if (!message.id) {
      message.id = `message-layout-${this.id++}`;
    } else {
      this.messages = this.messages.filter((i) => i.id !== message.id);
    }
    this.messages.push(message);

    this.messagesSubject.next(this.messages);

    return message;
  }

  removeMessage(id: string): void {
    this.messages = this.messages.filter((i) => i.id !== id);
    this.messagesSubject.next(this.messages);
  }

  clear(): void {
    this.messages = [];
    this.messagesSubject.next(this.messages);
  }
}

export class McitMessageLayout {
  id?: string;
  priority?: number; // 0 is high priority
  type?: 'INFO' | 'WARNING' | 'ERROR' = 'INFO';
  messageKey: string;
  link?: string;
  extraMessageKey?: string;
}
