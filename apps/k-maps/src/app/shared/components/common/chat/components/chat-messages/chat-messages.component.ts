import { Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { User } from '../../../auth/models/user.model';
import { McitChatMessagesHttpService } from '../../business/services/chat-messages-http.service';
import { IChatMessage, IMessageChunk } from '../../business/model/chat-message.model';
import { IChatDiscussion } from '../../business/model/chat-discussion.model';
import * as lodash from 'lodash';
import { catchError, concatMap, debounceTime, distinctUntilChanged, filter, map, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { BehaviorSubject, iif, interval, merge, of, Subject, timer } from 'rxjs';
import { McitSocketService } from '../../business/services/socket.service';
import { McitMenuDropdownService } from '../../../menu-dropdown/menu-dropdown.service';
import { ChatMessageType } from '../../business/domains/chat-message-type.domain';
import { Observable } from 'rxjs/internal/Observable';
import { INetworkStatus, McitNetworkLayoutService } from '../../../services/network-layout.service';
import { McitChatService } from '@lib-shared/common/chat/business/services/chat.service';
import { doCatch } from '@lib-shared/common/helpers/error.helper';
import { McitChatRepositoryService } from '@lib-shared/common/chat/business/services/chat-repository.service';
import { TranslateService } from '@ngx-translate/core';
import { McitPopupService } from '@lib-shared/common/services/popup.service';
import { McitChatDiscussionsHttpService } from '@lib-shared/common/chat/business/services/chat-discussions-http.service';
import { McitChatUtilsHttpService } from '@lib-shared/common/chat/business/services/chat-utils-http.service';
import { McitChatMessagesService } from '@lib-shared/common/chat/components/chat-messages/chat-messages.service';
import { DateTime } from 'luxon';
import { ChatHelper } from '@lib-shared/common/chat/business/helpers/chat.helper';
import { ISocketIsTypingData, ISocketNewMessageSent, SocketEventNames } from '@lib-shared/common/chat/business/domains/socket-event-name.domain';
import { ChatActorFrom } from '@lib-shared/common/chat/business/domains/chat-actor.domain';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';
import { sortBy } from 'lodash';
import { McitChatWaitingService } from '../../business/services/chat-waiting.service';

@TraceErrorClass()
@Component({
  selector: 'mcit-chat-messages',
  templateUrl: './chat-messages.component.html',
  styleUrls: ['./chat-messages.component.scss']
})
export class McitChatMessagesComponent implements OnInit, OnDestroy {
  @ViewChild('inputMessage')
  inputMessage: ElementRef;

  @Input()
  user: User;

  @Input()
  from: ChatActorFrom = ChatActorFrom.MOVEECAR_CARRIER;

  @Input()
  msgType: ChatMessageType = ChatMessageType.TRANSPORT;

  @Output()
  actionEvent = new EventEmitter<any>();

  @Output()
  sendMessageEvent = new EventEmitter<IChatMessage>();

  formGroup: UntypedFormGroup;
  waitingMessages = false;
  discussionId: string;
  userTyping: ISocketIsTypingData;
  currentDiscussion: IChatDiscussion;
  chatMessagesSubject$: BehaviorSubject<IChatMessage[]> = new BehaviorSubject<IChatMessage[]>([]);
  chatMessages$: Observable<IChatMessage[]>;
  numberMessageLoad = 0;
  showIsTyping = false;
  draftMessage$: Observable<string>;
  foundUsers$: Observable<User[]>;
  showAt = false;
  activeAtUser: User;
  isChatOffline = false;
  loading = false;
  error: string;
  CHAT_ACTOR_FROM = ChatActorFrom;
  CHAT_MESSAGE_TYPE = ChatMessageType;

  private nb = 0;
  private PAGES = 1;
  private idMessageToMakeUnread: string;
  private openedChat = true;
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private usernames: string[];
  private userAtSubject: Subject<string> = new Subject<string>();
  private messagesWithAt: IMessageChunk[] = [];
  private isLoadingPreviousMessages: boolean = false;

  constructor(
    private messagesHttpService: McitChatMessagesHttpService,
    private chatDiscussionsHttpService: McitChatDiscussionsHttpService,
    private socketService: McitSocketService,
    private menuDropdownService: McitMenuDropdownService,
    private chatService: McitChatService,
    private chatRepositoryService: McitChatRepositoryService,
    private networkLayoutService: McitNetworkLayoutService,
    private translateService: TranslateService,
    private popupService: McitPopupService,
    private chatUtilsHttpService: McitChatUtilsHttpService,
    private chatMessagesService: McitChatMessagesService,
    private formBuilder: UntypedFormBuilder,
    private chatWaitingService: McitChatWaitingService
  ) {
    this.formGroup = this.formBuilder.group({
      show_auto_messages: [true]
    });
    this.chatService.openChatStatus$.next(true);

    this.isLoading();

    this.chatMessages$ = this.networkLayoutService.networkInfo$.pipe(
      take(1),
      filter((status) => !!status),
      tap((status) => (this.isChatOffline = status !== INetworkStatus.online)),
      concatMap(() => {
        return this.chatRepositoryService.getChatInfos(this.user).pipe(
          concatMap((chatInfos) =>
            iif(
              () => this.isChatOffline,
              this.chatRepositoryService.getMessages(this.user, chatInfos?.current_discussion_id).pipe(
                tap((_) => {
                  this.currentDiscussion = chatInfos.all_discussions?.find((discussion: IChatDiscussion) => discussion?._id === chatInfos?.current_discussion_id);
                  this.discussionId = chatInfos.current_discussion_id;
                })
              ),
              this.chatService.currentDiscussion$.pipe(
                filter((currentDiscussion) => !!currentDiscussion),
                tap((discussion) => {
                  this.currentDiscussion = discussion;
                  this.discussionId = discussion._id;
                }),
                tap((_) => this.formGroup.get('show_auto_messages').setValue(chatInfos?.show_auto_messages == null ? true : chatInfos?.show_auto_messages)),
                concatMap(() => {
                  return this.messagesHttpService.findByDiscussionId(this.discussionId).pipe(map((data) => data.body.reverse()));
                }),
                tap(() => this.chatWaitingService.hideWaiting())
              )
            )
          )
        );
      }),
      tap((messages) => this.chatMessagesSubject$.next(messages)),
      switchMap(() =>
        this.chatMessagesSubject$.pipe(
          concatMap((messages) => this.chatRepositoryService.saveMessages(messages, this.discussionId, this.user).pipe(map(() => sortBy(messages, 'sender.sent_date.date')))),
          tap(() => this.isLoaded()),
          catchError((err) => {
            this.isLoaded();
            return doCatch('chat-messages _chatMessages$', err, null);
          })
        )
      )
    );

    this.draftMessage$ = this.chatRepositoryService.getChatInfos(this.user).pipe(map((chatInfos) => chatInfos?.discussions?.[this.discussionId]?.draftMessage ?? ''));
  }

  ngOnInit(): void {
    // update unread message
    merge(this.chatMessagesSubject$, this.chatService.refreshSubject$, this.destroy$)
      .pipe(
        filter(() => this.openedChat && !!this.chatMessagesSubject$.value.length),
        map(() =>
          (this.chatMessagesSubject$.value ?? [])
            .filter((msg) => msg?.sender?.sent_from !== this.from)
            .filter((msg) => !msg?.receiver?.read_date)
            .filter((msg) => msg._id?.length && this.idMessageToMakeUnread !== msg._id)
            .map((msg) => msg._id)
        ),
        filter((msgIds) => msgIds?.length > 0),
        distinctUntilChanged((a, b) => lodash.isEqual(a, b)),
        concatMap((msgIds) =>
          this.messagesHttpService.updateManyReadStatusMessages({
            ids: msgIds,
            read_date: { date: DateTime.local().toISO() }
          })
        ),
        tap(() => {
          this.socketService.emit(SocketEventNames.NEW_MESSAGE_RECEIVED);
        }),
        tap(() => this.chatService.refreshCountSubject$.next(true)),
        catchError((err) => doCatch('updateReadStatusForMessages', err, false))
      )
      .subscribe();

    this.foundUsers$ = this.userAtSubject
      .asObservable()
      .pipe()
      .pipe(
        takeUntil(this.destroy$),
        concatMap((word) =>
          this.messagesHttpService.findParticipantsUsernames(this.discussionId).pipe(
            map((usernames) => {
              this.usernames = usernames?.filter((username) => username !== this.user?.username);
              return { word, usernames: this.usernames };
            })
          )
        ),
        switchMap((data) => this.chatUtilsHttpService.autocompleteFromUsernames(data.word, data.usernames)),
        tap((users) => {
          this.showAt = users?.length > 0;
          this.activeAtUser = users?.[0];
        }),
        catchError((err) => doCatch('chat messages _foundUsers$', err, null))
      );

    this.socketService
      .events$<ISocketNewMessageSent>(SocketEventNames.NEW_MESSAGE_SENT)
      .pipe(
        takeUntil(this.destroy$),
        filter((chatMessage) => chatMessage?._id && chatMessage?.discussion_id === this.discussionId),
        tap(() => this.scrollToBottom()),
        concatMap((chatMessage) =>
          this.messagesHttpService.updateManyReadStatusMessages({
            ids: [chatMessage?._id],
            read_date: { date: DateTime.local().toISO() }
          })
        ),
        tap(() => {
          this.socketService.emit(SocketEventNames.NEW_MESSAGE_RECEIVED);
        }),
        catchError((err) => doCatch('chat messages NEW MESSAGE socket', err, null))
      )
      .subscribe();

    this.socketService
      .events$<ISocketIsTypingData>(SocketEventNames.IS_TYPING)
      .pipe(
        takeUntil(this.destroy$),
        tap((isTypingData) => {
          this.userTyping = isTypingData;
          // ne pas afficher les events is typing qui nous ne sont pas destiné.
          if (!this.showIsTyping && isTypingData.discussionId === this.discussionId) {
            this.showIsTyping = true;
            this.scrollToBottom();
            setInterval(() => (this.showIsTyping = false), 5000);
          }
        }),
        catchError((err) => doCatch('chat messages IS TYPING socket', err, null))
      )
      .subscribe();

    this.formGroup
      .get('show_auto_messages')
      .valueChanges.pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(),
        concatMap((showAutoMsg) => this.chatRepositoryService.saveShowAutoMessages(showAutoMsg, this.user).pipe(map(() => showAutoMsg)))
      )
      .subscribe();
  }

  private isLoading() {}

  private isLoaded() {
    this.loading = false;
    this.openedChat = true;
    if (!this.isLoadingPreviousMessages) {
      this.scrollToBottom(100);
    } else {
      this.scrollToMessageAfterLoad(() => (this.isLoadingPreviousMessages = false));
    }
  }

  ngOnDestroy(): void {
    this.openedChat = false;
    this.chatService.openChatStatus$.next(false);

    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  onRightClick($event: MouseEvent, divMessage: any, message: IChatMessage): void {
    if (this.from !== ChatActorFrom.MOVEECAR_DRIVER && message?.sender?.actor?.from === ChatActorFrom.MOVEECAR_DRIVER) {
      $event.stopPropagation();
      $event.preventDefault();
      this.doShowMenu(divMessage, message);
    }
  }

  doShowMenu(element, message: IChatMessage): void {
    const options = [];
    this.idMessageToMakeUnread = null;
    options.push({ code: 'unread', nameKey: 'CHAT.MARK_MESSAGE_AS_UNREAD' });
    this.menuDropdownService
      .chooseOptions(element, options)
      .pipe(
        concatMap((next) => {
          switch (next) {
            case 'unread':
              return this.chatDiscussionsHttpService.findDiscussionById(this.discussionId).pipe(
                concatMap((discussion) => {
                  this.idMessageToMakeUnread = message._id;
                  return this.messagesHttpService.update(message._id, lodash.omit(message, 'receiver.read_date')).pipe(tap(() => this.actionEvent.emit({ action: 'close', discussion })));
                })
              );
            default:
              return of(null);
          }
        })
      )
      .subscribe();
  }

  /**
   * send message and save it in db
   * @param inputMessage
   * @param discussion
   */
  doSendMessage(inputMessage: HTMLInputElement, discussion: IChatDiscussion): void {
    if (this.showAt) {
      this.selectSearchedUser(this.activeAtUser, inputMessage);
      return;
    }
    if (inputMessage.value) {
      const chatMessage = ChatHelper.buildCreateSendMessage(discussion, inputMessage.value, this.msgType, this.user, this.from, { text_splitted_with_contacts: ChatHelper.splitMessage(this.messagesWithAt, inputMessage.value) });

      if (this.from === ChatActorFrom.MOVEECAR_DRIVER) {
        // save in local storage for offline use
        this.chatRepositoryService.saveMessages(this.chatMessagesSubject$.value, this.discussionId, this.user).subscribe();
        this.chatMessagesSubject$.next([...this.chatMessagesSubject$.value, chatMessage]);
        this.sendMessageEvent.emit(chatMessage);
        this.refreshAfterSend();
      } else {
        // send message
        this.chatMessagesService
          .sendMessage(chatMessage)
          .pipe(
            tap(() => {
              this.chatMessagesSubject$.next([...this.chatMessagesSubject$.value, chatMessage]);
              this.refreshAfterSend();
            })
          )
          .subscribe();
      }
    }
  }

  selectSearchedUser(user: User, inputMessage: HTMLInputElement) {
    if (lodash.compact([user?.firstname, user?.lastname])?.length) {
      const atWord = `'@${user?.firstname}${user?.lastname}'`.replace(' ', '');
      this.inputMessage.nativeElement.value = ChatHelper.buildInputValueAt(inputMessage.value, atWord);
      this.showAt = false;
      if (!this.messagesWithAt.some((value) => value.word === atWord)) {
        this.messagesWithAt = [
          ...(this.messagesWithAt ?? []),
          {
            word: atWord,
            contact: {
              name: lodash.compact([user?.firstname, user?.lastname]).join(' '),
              email: user?.email,
              phone: user?.phone,
              language: this.translateService.currentLang
            }
          }
        ];
      }
      this.chatRepositoryService.saveDraftMessage(this.inputMessage.nativeElement.value, this.discussionId, this.user).subscribe();

      // Move focus to END of input field
      const end = this.inputMessage.nativeElement.value.length;
      this.inputMessage.nativeElement.setSelectionRange(end, end);
      this.inputMessage.nativeElement.value += ' ';
      this.inputMessage.nativeElement.focus();
    }
  }

  private refreshAfterSend(): void {
    this.inputMessage.nativeElement.value = '';
    this.messagesWithAt = [];
    this.scrollToBottom();
    this.chatRepositoryService.saveDraftMessage('', this.discussionId, this.user).subscribe();
  }

  deleteMessage(): void {
    this.inputMessage.nativeElement.value = '';
    this.chatRepositoryService.saveDraftMessage('', this.discussionId, this.user).subscribe();
  }

  scrollToBottom(wait: number = 10): void {
    setTimeout(() => {
      document.getElementById('anchorLastmessage')?.scrollIntoView({
        behavior: wait ? 'smooth' : undefined,
        block: 'start',
        inline: 'nearest'
      });
    }, wait);
  }

  scrollToMessageAfterLoad(onComplete?: () => void, wait: number = 500): void {
    setTimeout(() => {
      document.getElementById('messageBeforeLoad')?.scrollIntoView({
        block: 'start',
        inline: 'nearest'
      });
      if (onComplete) {
        onComplete();
      }
    }, wait);
  }

  isTyping(inputMessage: HTMLInputElement): void {
    if (this.nb > 2) {
      const isTypingData: ISocketIsTypingData = {
        discussionId: this.discussionId,
        from: this.from,
        user: {
          lastname: this.user.lastname,
          firstname: this.user.firstname,
          email: this.user.email
        }
      };
      this.socketService.emit<ISocketIsTypingData>(SocketEventNames.IS_TYPING, isTypingData);
      this.nb = 0;
    } else {
      this.nb++;
    }

    if (lodash.includes(inputMessage.value, '@')) {
      // AAA
      if (ChatHelper.isSpaceAfterSymboleAt(inputMessage.value)) {
        this.showAt = false;
      } else {
        const word = ChatHelper.findTheTypedWordAfterSymboleAt(inputMessage.value, '@')?.replace('@', '');
        if (word === '' || word?.length > 0) {
          this.userAtSubject.next(word);
        }
      }
    } else {
      this.showAt = false;
    }
    this.chatRepositoryService.saveDraftMessage(inputMessage.value, this.discussionId, this.user).subscribe();
  }

  processMessagePredefinedEvent(msg: string): void {
    if (msg) {
      this.inputMessage.nativeElement.value = msg;
      window.setTimeout(() => {
        this.inputMessage.nativeElement.focus();
      }, 500);
      this.chatRepositoryService.saveDraftMessage(msg, this.discussionId, this.user).subscribe();
    }
  }

  trackByMessage(index: number, chatMessage: IChatMessage): string {
    return chatMessage?._id && chatMessage?.sender?.sent_date?.date;
  }

  loadPreviousMessages(): void {
    if (this.isLoadingPreviousMessages) {
      return;
    }
    this.PAGES += 1;
    this.isLoadingPreviousMessages = true;
    this.messagesHttpService
      .findByDiscussionId(this.discussionId, this.PAGES)
      .pipe(
        tap((data) => {
          this.numberMessageLoad = data.body.length;
          this.chatMessagesSubject$.next(data.body.reverse().concat(this.chatMessagesSubject$.value));
        }),
        catchError((err) => {
          this.popupService.showError('COMMON.ERROR_NO.44');
          return doCatch('ERROR_NO.44 lib chat_loadPreviousMessages', err, null);
        })
      )
      .subscribe();
  }

  isActive(user: User): boolean {
    return this.activeAtUser?._id === user._id;
  }

  selectActive(user: User): void {
    this.activeAtUser = user;
  }

  /**
   * supprimer du champ input le user identifié par l'élément '@'
   * @param event
   */
  doDeleteSelectedAtUser(event: any): boolean {
    const value = event.srcElement.value;
    const indexOfTheCurrentInputCursor = event.srcElement.selectionStart;

    const deletedChar = value.charAt(indexOfTheCurrentInputCursor - 1);
    if (deletedChar === "'") {
      const wordToDelete = ChatHelper.findWordToDelete(value, indexOfTheCurrentInputCursor);
      this.inputMessage.nativeElement.value = value.replace(wordToDelete, '');
    }
    return true;
  }

  /**
   * listen to event escape to close At list.
   * @param event
   */
  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: KeyboardEvent) {
    if (this.showAt) {
      this.showAt = false;
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
