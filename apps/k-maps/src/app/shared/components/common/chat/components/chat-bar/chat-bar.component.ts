import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { User } from '../../../auth/models/user.model';
import { McitOffcanvasRef } from '@lib-shared/common/offcanvas/offcanvas-ref';
import { McitChatDiscussionComponent } from '@lib-shared/common/chat/components/chat-discussion/chat-discussion.component';
import { McitOffcanvas } from '@lib-shared/common/offcanvas/offcanvas.service';
import { McitChatService } from '@lib-shared/common/chat/business/services/chat.service';
import { Observable } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';
import { ChatActorFrom } from '@lib-shared/common/chat/business/domains/chat-actor.domain';
import { CHAT_MESSAGE_TYPES, ChatMessageType } from '@lib-shared/common/chat/business/domains/chat-message-type.domain';

@TraceErrorClass()
@Component({
  selector: 'mcit-chat-bar',
  templateUrl: './chat-bar.component.html',
  styleUrls: ['./chat-bar.component.scss'],
  animations: [
    trigger('openClose', [
      // ...
      state(
        'open',
        style({
          right: '798px'
        })
      ),
      state(
        'closed',
        style({
          right: '0px'
        })
      ),
      transition('open => closed', [animate('0.2s')]),
      transition('closed => open', [animate('0.2s')])
    ])
  ]
})
export class McitChatBarComponent implements OnInit, OnDestroy {
  user$: Observable<User>;
  convOffCanvasRef: McitOffcanvasRef<McitChatDiscussionComponent>;
  CHAT_ACTOR_FROM = ChatActorFrom;
  chatMessageTypes: ChatMessageType[] = CHAT_MESSAGE_TYPES;

  constructor(private offcanvas: McitOffcanvas, private chatService: McitChatService) {
    this.user$ = this.chatService.getUser$().pipe(
      tap((user) => {
        this.chatMessageTypes = CHAT_MESSAGE_TYPES.filter((t) => user.apps.dispatcher.roles?.includes(t?.toLowerCase()));
      })
    );
  }

  ngOnInit(): void {
    this.chatService.openChat$
      .pipe(
        filter((b) => b),
        tap(() => this.doShowConv(true))
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    if (this.convOffCanvasRef != null) {
      this.chatService.manageChatOpenStatus(false);
      this.convOffCanvasRef.close();
    }
  }

  doShowConv(shoudNotCloseCanvas?: boolean): void {
    if (this.convOffCanvasRef != null) {
      if (!shoudNotCloseCanvas) {
        this.chatService.manageChatOpenStatus(false);
        this.convOffCanvasRef.close();
        this.convOffCanvasRef = null;
      }
      return;
    }
    this.chatService.manageChatOpenStatus(true);
    this.convOffCanvasRef = this.offcanvas.open(McitChatDiscussionComponent, {
      enableBodyScroll: true,
      disableClose: true,
      hasBackdrop: false,
      autoFocus: false,
      position: 'end',
      offcanvasClass: 'background-chat',
      style: ''
    });
  }

  /**
   * listen to event escape to close At list.
   * @param event
   */
  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: KeyboardEvent) {
    if (this.convOffCanvasRef != null) {
      this.convOffCanvasRef.close();
      this.convOffCanvasRef = null;
      return;
    }
  }
}
