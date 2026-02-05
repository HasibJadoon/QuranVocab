import { Injectable, OnDestroy } from '@angular/core';
import { McitSocketService } from './socket.service';
import { catchError, concatMap, defaultIfEmpty, distinctUntilChanged, filter, map, mergeMap, scan, shareReplay, startWith, switchMap, take, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import { McitChatDiscussionsHttpService } from './chat-discussions-http.service';
import { IChatDiscussion, SortMessageType } from '../model/chat-discussion.model';
import { McitTabMenuService } from '../../../layouts/tab-menu.service';
import { BehaviorSubject, combineLatest, EMPTY, forkJoin, Observable, of, ReplaySubject, Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { DateTime } from 'luxon';
import * as lodash from 'lodash';
import { Period } from '@lib-shared/common/models/domains/period.domain';
import { doCatch } from '@lib-shared/common/helpers/error.helper';
import { McitContextHeaderService } from '@lib-shared/common/context-header/services/context-header.service';
import { Applications } from '@lib-shared/common/context-header/domains/context-type.domain';
import { McitCoreConfig } from '@lib-shared/common/helpers/provider.helper';
import { McitAuthProviderService } from '@lib-shared/common/auth';
import { McitChatRepositoryService } from '@lib-shared/common/chat/business/services/chat-repository.service';
import { User } from '@lib-shared/common/auth/models/user.model';
import { ChatHelper } from '@lib-shared/common/chat/business/helpers/chat.helper';
import { McitChatUtilsHttpService } from '@lib-shared/common/chat/business/services/chat-utils-http.service';
import { ISocketChatRightChange, ISocketNewMessageReceive, ISocketNewMessageSent, SocketEventNames } from '@lib-shared/common/chat/business/domains/socket-event-name.domain';
import { ChatActorFrom } from '@lib-shared/common/chat/business/domains/chat-actor.domain';
import { CHAT_MESSAGE_TYPES, ChatMessageType } from '@lib-shared/common/chat/business/domains/chat-message-type.domain';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';
import { McitNetworkLayoutService } from '@lib-shared/common/services/network-layout.service';
import { IChatMessage } from '@lib-shared/common/chat/business/model/chat-message.model';
import { IContainerContext } from '@lib-shared/common/context-header/context-header.component';

export interface IOpenChatInfos {
  from: Applications;
  discussionId: string;
}

@TraceErrorClass()
@Injectable({
  providedIn: 'root'
})
export class McitChatService implements OnDestroy {
  discussions$: Observable<IChatDiscussion[]>;
  currentDiscussion$: Observable<IChatDiscussion>;
  openChat$: Observable<boolean>;
  onClickListenerRequested$ = new Subject<void>();
  discussionsCount$: Observable<{ [key: string]: number }>;
  _isChatOpen = new BehaviorSubject<boolean>(false);
  public openChatStatus$ = new BehaviorSubject<boolean>(false);
  byMessageType$ = new BehaviorSubject<boolean>(false);
  messageTypeSelected$ = new BehaviorSubject<ChatMessageType>(null);
  isChangingMessageType$ = new BehaviorSubject<boolean>(false);
  lastMessageSent$ = new BehaviorSubject<IChatMessage>(null);
  pagination$ = new BehaviorSubject<{ page: number; perPage: number }>({ page: 1, perPage: 10 });
  triggerPagination$ = new BehaviorSubject<boolean>(false);
  sortType$ = new BehaviorSubject<SortMessageType>(SortMessageType.UNREAD_ON_TOP);

  private _user: User;
  private changeCurrentDiscussionSubject$ = new BehaviorSubject<string>('');
  public refreshSubject$ = new Subject<boolean>();
  private destroy$ = new Subject<boolean>();
  private openStatus = false;
  private _userSubject$ = new ReplaySubject<User>(1);
  public refreshCountSubject$ = new Subject<boolean>();

  constructor(
    private socketService: McitSocketService,
    private chatDiscussionsHttpService: McitChatDiscussionsHttpService,
    private authProviderService: McitAuthProviderService,
    private tabMenuService: McitTabMenuService,
    private translateService: TranslateService,
    private contextHeaderService: McitContextHeaderService,
    private chatRepositoryService: McitChatRepositoryService,
    private chatUtilsHttpService: McitChatUtilsHttpService,
    private config: McitCoreConfig,
    private networkLayoutService: McitNetworkLayoutService
  ) {
    this.discussions$ = combineLatest([
      this._userSubject$.asObservable(),
      this.socketService.events$<ISocketNewMessageReceive>(SocketEventNames.NEW_MESSAGE_RECEIVED).pipe(
        startWith(true),
        distinctUntilChanged((prev, curr) => (this.config.app !== Applications.driver ? JSON.stringify(prev) === JSON.stringify(curr) : false))
      ),
      this.socketService.events$<ISocketNewMessageSent>(SocketEventNames.NEW_MESSAGE_SENT).pipe(
        startWith(true),
        distinctUntilChanged((prev, curr) => (this.config.app !== Applications.driver ? JSON.stringify(prev) === JSON.stringify(curr) : false))
      ),
      this.contextHeaderService.currentContainerContext$.pipe(distinctUntilChanged((prev, curr) => prev.current._id === curr.current._id)),
      this.isChangingMessageType$.pipe(filter((value) => value)),
      this.refreshSubject$.asObservable().pipe(startWith(true)),
      this.networkLayoutService.networkInfo$.pipe(distinctUntilChanged()),
      this.triggerPagination$.asObservable()
    ]).pipe(
      mergeMap((arr) => {
        let [user, messageReceived, messageSent, currentContext, isChangingMessageType, refreshSubject, networkInfo] = arr;
        const isChatOpen = this._isChatOpen.value;

        const paginationObj = this.pagination$.value;

        //This is for avoiding triggering loadDisussions when mesaggeSent is the same in consecuent emissions.
        if (messageSent !== true) {
          if (JSON.stringify(this.lastMessageSent$.value) !== JSON.stringify(messageSent)) {
            this.lastMessageSent$.next(messageSent as IChatMessage);
          } else {
            messageSent = true;
          }
        }

        //This will only trigger loadDiscussions if the chat is open and if the user is changing the message type,
        //or if the message sent type is the same as the selected one
        //in order to avoid load discussions when a socket message sent event has a messageType different than the selected one.
        //it also checks if the messageSent event corresponds to the current context (carrier) (only for dispatcher web).
        if (
          isChatOpen &&
          (this.isChangingMessageType$.value ||
            messageSent === true ||
            ((messageSent as IChatMessage).type === this.messageTypeSelected$.value &&
              (this.config.app === Applications.driver ? true : (messageSent as IChatMessage).receiver?.actor?.entity_id === (currentContext as IContainerContext)?.current?._id)))
        ) {
          this.isChangingMessageType$.next(false);
          if (messageSent && (messageSent as IChatMessage).discussion_id) {
            return this.chatDiscussionsHttpService.findDiscussionById((messageSent as IChatMessage).discussion_id).pipe(
              switchMap((discussion) => {
                if (discussion) {
                  if (this.config.app === Applications.driver) {
                    return this.chatUtilsHttpService.findResourceByUsername(ChatActorFrom.MOVEECAR_DRIVER).pipe(
                      switchMap((resource) => {
                        if (resource && resource?._id === discussion?.key?.resource_id) {
                          return this.loadDiscussions(this.config.app, user as User, this.messageTypeSelected$.value, paginationObj.page, paginationObj.perPage, this.sortType$.value);
                        } else {
                          return EMPTY;
                        }
                      }),
                      catchError((err) => EMPTY)
                    );
                  } else {
                    return this.contextHeaderService.currentContainerContext$.pipe(
                      switchMap((containerContext) => {
                        if (containerContext && discussion?.key?.carrier_id === containerContext?.current?._id) {
                          return this.loadDiscussions(this.config.app, user as User, this.messageTypeSelected$.value, paginationObj.page, paginationObj.perPage, this.sortType$.value);
                        } else {
                          return EMPTY;
                        }
                      }),
                      take(1),
                      catchError((err) => doCatch('Resource search error', err, null))
                    );
                  }
                } else {
                  return EMPTY;
                }
              }),
              catchError((err) => doCatch('Discussion search error', err, null))
            );
          } else return this.loadDiscussions(this.config.app, user as User, this.messageTypeSelected$.value, paginationObj.page, paginationObj.perPage, this.sortType$.value);
        } else {
          return EMPTY;
        }
      }),
      takeUntil(this.destroy$),
      shareReplay(1),
      catchError((err) => doCatch('Discussion update error', err, null))
    );

    this.discussionsCount$ = combineLatest([
      this._userSubject$.asObservable(),
      this.socketService.events$<ISocketNewMessageReceive>(SocketEventNames.NEW_MESSAGE_RECEIVED).pipe(
        startWith(true),
        withLatestFrom(this.openChatStatus$),
        filter(([_, openChatStatus]) => (this.config.app !== Applications.driver ? !openChatStatus : true))
      ),
      this.socketService.events$<ISocketNewMessageSent>(SocketEventNames.NEW_MESSAGE_SENT).pipe(
        startWith(true),
        withLatestFrom(this.openChatStatus$),
        filter(([_, openChatStatus]) => (this.config.app !== Applications.driver ? !openChatStatus : true))
      ),
      this.networkLayoutService.networkInfo$.pipe(distinctUntilChanged()),
      this.refreshCountSubject$.pipe(startWith(true)),
      this.contextHeaderService.currentContainerContext$.pipe(distinctUntilChanged((prev, curr) => prev.current._id === curr.current._id))
    ]).pipe(
      mergeMap(([user]) => {
        if (this.config.app === Applications.driver) {
          if (this.byMessageType$.value) {
            const chatMessageTypes = CHAT_MESSAGE_TYPES.filter((t) => user?.apps?.driver?.roles?.includes(`driver_chat_${t.toLowerCase()}`));
            if (user.apps?.driver?.roles?.includes(ChatMessageType.TRANSPORT.toLowerCase())) {
              chatMessageTypes.push(ChatMessageType.TRANSPORT);
            }
            return this.getUnreadMessagesCount(user, Applications.driver, chatMessageTypes).pipe(
              tap((count) => {
                this.tabMenuService?.count(6, count.total);
              })
            );
          }
          return this.getUnreadMessagesCount(user, Applications.driver).pipe(
            tap((count) => {
              this.tabMenuService?.count(6, count.total);
            })
          );
        } else {
          if (this.byMessageType$.value) {
            const chatMessageTypes = CHAT_MESSAGE_TYPES.filter((t) => user.apps.dispatcher.roles?.includes(t?.toLowerCase()));
            return this.getUnreadMessagesCount(user, Applications.dispatcher, chatMessageTypes);
          }
          return this.getUnreadMessagesCount(user, Applications.dispatcher);
        }
      }),
      shareReplay(1)
    );

    this.getUser$().pipe(take(1)).subscribe();

    this.socketService
      .events$<ISocketChatRightChange>(SocketEventNames.HAS_ROLE_CHANGE)
      .pipe(
        concatMap((user) => {
          if (user.user_id === this._user._id) {
            return this.getUser$(true).pipe(take(1));
          }
        }),
        takeUntil(this.destroy$),
        catchError((err) => doCatch('chat messages IS TYPING socket', err, null))
      )
      .subscribe();
    this.currentDiscussion$ = combineLatest([
      this.discussions$.pipe(distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))),
      this.changeCurrentDiscussionSubject$.pipe(distinctUntilChanged((prev, curr) => prev === curr))
    ]).pipe(
      filter((b) => !!b?.length),
      concatMap(([discussions, currentDiscId]) => {
        if (!currentDiscId?.length) {
          return of(null);
        }
        const foundDiscussion = discussions.find((dis) => dis?._id === currentDiscId);
        if (foundDiscussion) {
          return of(foundDiscussion);
        }
        return this.chatDiscussionsHttpService.findDiscussionById(currentDiscId).pipe(
          catchError((err) => {
            return of(null);
          })
        );
      }),
      takeUntil(this.destroy$),
      shareReplay(1)
    );

    this.openChat$ = this.currentDiscussion$.pipe(
      map(() => this.openStatus),
      tap(() => (this.openStatus = false))
    );
  }

  init(): void {
    this.discussionsCount$.subscribe();
  }

  manageChatOpenStatus(status: boolean): void {
    this._isChatOpen.next(status);
  }

  setSortType(sortType: SortMessageType): void {
    this.sortType$.next(sortType);
  }

  private loadDiscussions(sourceUser: string, user: User, messageType?: ChatMessageType, page: number = 1, perPage: number = 10, sortType?: SortMessageType): Observable<IChatDiscussion[]> {
    switch (sourceUser) {
      case Applications.driver:
        return this.loadDiscussionOnPhone(user, page, perPage, messageType);
      case Applications.dispatcher:
        return this.loadDiscussionOnWeb(user, messageType, page, perPage, sortType);
      default:
        return of([]);
    }
  }

  ngOnDestroy(): void {
    this.chatRepositoryService.saveOpenedDiscussion(null, this._user);
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  refresh(): void {
    this.refreshSubject$.next(true);
  }

  refreshAll(): void {
    this.refreshSubject$.next(true);
    this.refreshCountSubject$.next(true);
  }

  open(infos: IOpenChatInfos): void {
    this.openStatus = true;
    this.changeCurrentDiscussion(infos?.discussionId);
  }

  getUser$(force?: boolean): Observable<User | null> {
    if (this._user && !force) {
      return of(this._user);
    }

    return this.authProviderService.authorization$.pipe(
      switchMap((auth) => {
        if (!auth) {
          return of(null);
        }
        return this.authProviderService.whoIAm(force).pipe(catchError((err) => doCatch('chat authorization$', err, null)));
      }),
      filter((user) => !!user),
      tap((user) => {
        this._user = user;
        this._userSubject$.next(user);
      })
    );
  }

  changeCurrentDiscussion(discussionId: string): void {
    this.changeCurrentDiscussionSubject$.next(discussionId);
  }

  startOnClickListenerForLocalNotification(): void {
    this.onClickListenerRequested$.next();
  }

  private loadDiscussionOnPhone(user: User, page: number = 1, perPage: number = 10, messageType?: ChatMessageType): Observable<IChatDiscussion[]> {
    return this.chatUtilsHttpService.findResourceByUsername(ChatActorFrom.MOVEECAR_DRIVER).pipe(
      switchMap((resource) => {
        const dateToSet = DateTime.fromJSDate(new Date());
        const periodToSet = dateToSet.hour >= 12 ? Period.AFTERNOON : Period.MORNING;
        return this.chatUtilsHttpService
          .searchResourceAssociation({
            carrier_id: resource?.carrier_id,
            resource_id: resource._id,
            start_date: dateToSet.toISODate(),
            end_date: dateToSet.toISODate(),
            start_period: periodToSet,
            end_period: periodToSet
          })
          .pipe(
            concatMap((associations) =>
              this.chatDiscussionsHttpService
                .searchDiscussions(
                  {
                    key_carrier_id: resource?.carrier_id,
                    key_resource_id: resource?._id,
                    page: 1,
                    per_page: 0,
                    sort: '-last_messages.created_date'
                  },
                  true
                )
                .pipe(
                  map((discussions) => discussions?.body),
                  concatMap((discussions) =>
                    forkJoin([
                      ...CHAT_MESSAGE_TYPES.reduce<Observable<IChatDiscussion>[]>((acc, msgType) => {
                        const discFound = discussions.find((d) => d?.key?.msg_type === msgType);
                        const currentDiscussion = ChatHelper.buildChatDiscussion(msgType, resource, associations, user, this.translateService);
                        const isAllowedType = msgType === ChatMessageType.TRANSPORT || user?.apps?.driver?.roles?.includes(`driver_chat_${msgType.toLowerCase()}`);
                        if (discFound) {
                          acc.push(this.updateCurrentDiscussionWithLabelsOrTags(discFound, currentDiscussion));
                        } else if (isAllowedType) {
                          acc.push(this.chatDiscussionsHttpService.createDiscussion(currentDiscussion));
                        }
                        return acc;
                      }, [])
                    ])
                  ),
                  map((discussions) =>
                    discussions.filter((disc) => disc?.key?.msg_type === ChatMessageType.TRANSPORT || disc?.group?.find((chatActor) => chatActor?.driver_chat_roles?.includes(`driver_chat_${disc?.key?.msg_type.toLowerCase()}`)))
                  ),
                  tap((discussions) => {
                    this.startOnClickListenerForLocalNotification();
                  }),
                  defaultIfEmpty([]),
                  catchError((err) => doCatch('_loadDiscussionFromDriver', err, []))
                )
            )
          );
      })
    );
  }

  private loadDiscussionOnWeb(user: User, messageType?: ChatMessageType, page: number = 1, perPage: number = 10, sortType?: SortMessageType): Observable<IChatDiscussion[]> {
    return this.contextHeaderService.currentContainerContext$.pipe(
      filter((containerContext) => !!containerContext),
      concatMap((containerContext) => this.chatRepositoryService.getChatInfos(user).pipe(map((chatInfos) => ({ chatInfos, containerContext })))),
      concatMap((res) => {
        return this.chatDiscussionsHttpService.searchDiscussions(
          {
            ...res?.chatInfos?.filters,
            key_carrier_id: res.containerContext?.current?._id,
            page,
            per_page: perPage,
            sort: '-last_messages.created_date',
            sort_type: sortType,
            with_driver_chat_roles: true,
            key_msg_type: messageType ? messageType : undefined
          },
          true,
          !!messageType
        );
      }),
      take(1),
      map((discussions) => discussions?.body)
    );
  }

  /**
   * update discussion if changes are detected
   * @param oldDiscussion
   * @param newDiscussion
   * @private
   */
  private updateCurrentDiscussionWithLabelsOrTags(oldDiscussion: IChatDiscussion, newDiscussion: IChatDiscussion): Observable<IChatDiscussion> {
    if (
      ChatHelper.findActor(oldDiscussion, ChatActorFrom.MOVEECAR_DRIVER)?.resource?.code !== ChatHelper.findActor(newDiscussion, ChatActorFrom.MOVEECAR_DRIVER)?.resource?.code ||
      ChatHelper.findActor(oldDiscussion, ChatActorFrom.MOVEECAR_DRIVER)?.resource?.label_full_name_with_associated !== ChatHelper.findActor(newDiscussion, ChatActorFrom.MOVEECAR_DRIVER)?.resource?.label_full_name_with_associated ||
      ChatHelper.findActor(oldDiscussion, ChatActorFrom.MOVEECAR_DRIVER)?.resource?.type !== ChatHelper.findActor(newDiscussion, ChatActorFrom.MOVEECAR_DRIVER)?.resource?.type ||
      !lodash.isEqual(ChatHelper.findActor(oldDiscussion, ChatActorFrom.MOVEECAR_DRIVER)?.driver_chat_roles, ChatHelper.findActor(newDiscussion, ChatActorFrom.MOVEECAR_DRIVER)?.driver_chat_roles) ||
      !lodash.isEqual(oldDiscussion?.tags, newDiscussion?.tags)
    ) {
      return this.chatDiscussionsHttpService.updateDiscussion(oldDiscussion?._id, newDiscussion);
    } else {
      return of(oldDiscussion);
    }
  }

  getUnreadMessagesCount(user, app: Applications, chatMessageType?: ChatMessageType[]): Observable<{ [key: string]: number }> {
    if (app === Applications.driver) {
      return this.chatUtilsHttpService.findResourceByUsername(ChatActorFrom.MOVEECAR_DRIVER).pipe(
        switchMap((resource) => {
          return this.chatDiscussionsHttpService.getUnreadMessagesOrDiscussionsCount(
            {
              key_carrier_id: resource?.carrier_id,
              key_resource_id: resource?._id,
              chat_actor_from: ChatActorFrom.MOVEECAR_DRIVER,
              key_msg_type: chatMessageType ? chatMessageType.join(',') : undefined,
              only_unread_messages_count: true
            },
            true,
            !!chatMessageType
          );
        })
      );
    } else if (app === Applications.dispatcher) {
      return this.contextHeaderService.currentContainerContext$.pipe(
        filter((containerContext) => !!containerContext),
        concatMap((containerContext) => this.chatRepositoryService.getChatInfos(user).pipe(map((chatInfos) => ({ chatInfos, containerContext })))),
        concatMap((res) => {
          return this.chatDiscussionsHttpService.getUnreadMessagesOrDiscussionsCount(
            {
              ...res?.chatInfos?.filters,
              key_carrier_id: res.containerContext?.current?._id,
              with_driver_chat_roles: true,
              chat_actor_from: ChatActorFrom.MOVEECAR_CARRIER,
              key_msg_type: chatMessageType ? chatMessageType.join(',') : undefined
            },
            true,
            !!chatMessageType
          );
        }),
        take(1)
      );
    }
  }
}
