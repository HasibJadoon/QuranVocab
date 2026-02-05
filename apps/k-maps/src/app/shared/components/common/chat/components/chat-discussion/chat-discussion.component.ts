import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { catchError, concatMap, count, debounceTime, distinctUntilChanged, filter, map, mergeMap, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { from, merge, Observable, Subject, Subscription, timer } from 'rxjs';
import { Params } from '@angular/router';
import { IChatInfos, McitChatRepositoryService } from '@lib-shared/common/chat/business/services/chat-repository.service';
import { McitChatService } from '@lib-shared/common/chat/business/services/chat.service';
import { doCatch } from '@lib-shared/common/helpers/error.helper';
import { McitChatMessagesMassModalService } from '@lib-shared/common/chat/components/chat-messages-mass-modal/chat-messages-mass-modal.service';
import { McitChatWaitingService } from '@lib-shared/common/chat/business/services/chat-waiting.service';
import { User } from '@lib-shared/common/auth/models/user.model';
import { ISearchModel } from '@lib-shared/common/search/search-model';
import { CHAT_MESSAGE_TYPES, ChatMessageType } from '@lib-shared/common/chat/business/domains/chat-message-type.domain';
import { IChatDiscussion, IChatDiscussionSearchFilter, SortMessageType } from '@lib-shared/common/chat/business/model/chat-discussion.model';
import { FilterType, ISearchOptions } from '@lib-shared/common/search/search-options';
import { McitChatDiscussionsHttpService } from '../../business/services/chat-discussions-http.service';
import { McitSearchService } from '@lib-shared/common/search/search.service';
import { McitPopupService } from '@lib-shared/common/services/popup.service';
import { McitChatMessagesService } from '@lib-shared/common/chat/components/chat-messages/chat-messages.service';
import { ChatHelper } from '@lib-shared/common/chat/business/helpers/chat.helper';
import { ChatActorFrom } from '@lib-shared/common/chat/business/domains/chat-actor.domain';
import * as lodash from 'lodash';
import { IChatMessage } from '@lib-shared/common/chat/business/model/chat-message.model';
import { animate, query, sequence, style, transition, trigger } from '@angular/animations';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';

const SORT_OPTIONS = [
  { code: SortMessageType.UNREAD_ON_TOP, nameKey: 'CHAT.FILTERS.SORT_MESSAGES.TYPES.UNREAD_ON_TOP' },
  { code: SortMessageType.LATEST_ON_TOP, nameKey: 'CHAT.FILTERS.SORT_MESSAGES.TYPES.LATEST_ON_TOP' }
];

@TraceErrorClass()
@Component({
  selector: 'mcit-chat-discussion',
  templateUrl: './chat-discussion.component.html',
  styleUrls: ['./chat-discussion.component.scss'],
  animations: [
    trigger('badge-anim', [
      transition(':increment', [
        query(':self', [style({ overflow: 'visible' })]),
        query('.my-badge', [style({ transform: 'scale(1,1)' }), sequence([animate('.4s ease', style({ transform: 'scale(2,2)' })), animate('.2s ease', style({ transform: 'scale(1,1)' }))])], { optional: true })
      ])
    ])
  ]
})
export class McitChatDiscussionComponent implements OnInit, OnDestroy {
  @Input()
  from: ChatActorFrom = ChatActorFrom.MOVEECAR_CARRIER;

  @Output()
  sendMessageEvent = new EventEmitter<IChatMessage>();

  msgType: ChatMessageType;

  private refreshSubject: Subject<boolean> = new Subject<boolean>();

  CHAT_ACTOR_FROM = ChatActorFrom;
  destroy$: Subject<boolean> = new Subject<boolean>();
  user: User;
  waiting = false;
  query: string;
  currentPage = 1;
  perPage = 10;
  allDiscussions: IChatDiscussion[] = [];
  hasMoreDiscussions = true;
  loadingMore = false;
  searchBox: ISearchModel;
  querySubject = new Subject<ISearchModel>();
  chatMessageTypes: ChatMessageType[] = CHAT_MESSAGE_TYPES;
  discussions$: Observable<IChatDiscussion[] | {}>;
  currentDiscussion$: Observable<IChatDiscussion>;
  defaultSort = SortMessageType.UNREAD_ON_TOP;
  storageSortKey: SortMessageType = this.defaultSort;
  options = SORT_OPTIONS;
  searchOptions: ISearchOptions = {
    showInfoText: false,
    size: 'small',
    save: {
      id: 'chat',
      history: true,
      favorite: true
    },
    filters: {
      filtersConfig: {
        tags: {
          type: FilterType.TAGS,
          nameKey: 'CHAT.FILTERS.TAGS',
          tags: {
            result: 'string'
          }
        },
        costs_types: {
          type: FilterType.CHECK_LIST,
          nameKey: 'CHAT.FILTERS.COSTS_TYPES.TITLE',
          checkList: {
            values: [
              { code: 'MRI', nameKey: 'CHAT.FILTERS.COSTS_TYPES.TYPES.MRI' },
              { code: 'MRE', nameKey: 'CHAT.FILTERS.COSTS_TYPES.TYPES.MRE' }
            ],
            result: 'string'
          }
        }
      }
    }
  };
  countByType: { [key: string]: number } = {};
  countByTypeSubscription: Subscription;
  isChangingType = false;
  scrollTimeout: ReturnType<typeof setTimeout>;
  private lastScrollHeight = 0;
  private lastContainerHeight = 0;
  private stableButtonState = false;

  constructor(
    private searchService: McitSearchService,
    private chatMessagesMassModalService: McitChatMessagesMassModalService,
    private popupService: McitPopupService,
    private chatWaitingService: McitChatWaitingService,
    private chatMessageService: McitChatMessagesService,
    private chatRepositoryService: McitChatRepositoryService,
    private chatService: McitChatService,
    private chatDiscussionsHttpService: McitChatDiscussionsHttpService,
    private cdr: ChangeDetectorRef
  ) {
    this.currentDiscussion$ = this.chatService.currentDiscussion$;
    this.searchBox = { text: '', filters: {} };
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
    this.countByTypeSubscription?.unsubscribe();
    this.chatService.byMessageType$.next(false);

    // Clean up timeouts to prevent memory leaks
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  }

  ngOnInit(): void {
    this.initSearchModel()
      .pipe(
        tap((searchModel) => (this.searchBox = searchModel)),
        tap(() => {
          this.chatService.setSortType(this.storageSortKey);
          this.refreshSubject.next(true);
        })
      )
      .subscribe();

    this.setupDiscussionsPagination();

    this.chatWaitingService
      .waiting$()
      .pipe(takeUntil(this.destroy$), debounceTime(300), distinctUntilChanged())
      .subscribe((next: boolean) =>
        setTimeout(() => {
          this.waiting = next;
        }, 0)
      );
    this.chatService.byMessageType$.next(true);
    this.countByTypeSubscription = this.chatService.discussionsCount$.subscribe((discussionsCount) => {
      this.countByType = discussionsCount;
      this.cdr.detectChanges();
    });
    this.chatService.refreshCountSubject$.next(true);
  }

  setupDiscussionsPagination(): void {
    this.discussions$ = merge(
      timer(0),
      this.querySubject.asObservable().pipe(
        tap(() => {
          this.currentPage = 1;
          this.allDiscussions = [];
          this.hasMoreDiscussions = true;
          this.chatService.pagination$.next({ page: this.currentPage, perPage: this.perPage });
        })
      ),
      this.refreshSubject.asObservable().pipe(
        filter((elem) => elem),
        tap(() => {
          this.currentPage = 1;
          this.allDiscussions = [];
          this.hasMoreDiscussions = true;
          this.chatService.pagination$.next({ page: this.currentPage, perPage: this.perPage });
        })
      )
    ).pipe(
      filter(() => !!this.searchBox && (this.searchBox.text.length === 0 || this.searchBox.text.length >= 3)),
      takeUntil(this.destroy$),
      debounceTime(1000),
      concatMap(() => this.saveKeys()),
      tap(() => {
        const roles = this.from === ChatActorFrom.MOVEECAR_DRIVER ? this.user.apps.driver.roles : this.user.apps.dispatcher.roles;
        this.chatMessageTypes = CHAT_MESSAGE_TYPES.filter((t) => roles?.includes(t?.toLowerCase()));
        this.msgType = ChatMessageType[this.chatMessageTypes?.[0]];
        this.chatService.messageTypeSelected$.next(this.msgType);
        this.chatService.isChangingMessageType$.next(true);
      }),
      switchMap(() =>
        this.chatService.discussions$.pipe(
          concatMap((discussions: IChatDiscussion[]) =>
            this.chatRepositoryService.getChatInfos(this.user).pipe(
              tap((chatInfos) => {
                if (this.isChangingType) {
                  this.isChangingType = false;
                } else {
                  if (chatInfos?.opened_discussion_id) {
                    this.chatService.changeCurrentDiscussion(chatInfos?.opened_discussion_id);
                  } else if (this.from === ChatActorFrom.MOVEECAR_DRIVER) {
                    this.chatService.changeCurrentDiscussion(discussions?.find((d) => d?.key?.msg_type === this.msgType)?._id);
                  }
                }
              }),
              concatMap(() => this.chatRepositoryService.saveCurrentDiscussion(discussions?.find((d) => d?.key?.msg_type === this.msgType)?._id, this.user)),
              concatMap(() => this.chatRepositoryService.saveDiscussions(discussions, this.user).pipe(map(() => discussions)))
            )
          ),
          tap((newDiscussions: IChatDiscussion[]) => {
            if (this.currentPage === 1) {
              this.allDiscussions = [...newDiscussions];
              this.lastScrollHeight = 0;
              this.lastContainerHeight = 0;
            } else {
              const ids = new Set(this.allDiscussions.map((d) => d._id));
              this.allDiscussions = [...this.allDiscussions, ...newDiscussions.filter((d) => !ids.has(d._id))];
              this.lastScrollHeight = 0;
              this.lastContainerHeight = 0;
            }
            this.hasMoreDiscussions = newDiscussions.length === this.perPage;
            this.loadingMore = false;
          }),
          map(() => this.allDiscussions)
        )
      ),
      tap(() => this.chatWaitingService.hideWaiting()),
      takeUntil(this.destroy$),
      catchError((err) => doCatch(`chat discussions _discussions$`, err, []))
    );
  }

  loadMoreDiscussions(): void {
    if (this.loadingMore || !this.hasMoreDiscussions) return;
    this.loadingMore = true;
    this.chatWaitingService.showWaiting();
    this.currentPage += 1;
    this.chatService.pagination$.next({ page: this.currentPage, perPage: this.perPage });
    this.chatService.triggerPagination$.next(true);
  }

  doRefresh(): void {
    this.currentPage = 1;
    this.allDiscussions = [];
    this.hasMoreDiscussions = true;
    this.chatService.pagination$.next({ page: this.currentPage, perPage: this.perPage });
    this.refreshSubject.next(true);
  }

  /**
   * open chat for this discussion.
   * @param discussion
   */
  doOpenChat(discussion: IChatDiscussion): void {
    this.chatRepositoryService
      .saveOpenedDiscussion(discussion?._id, this.user)
      .pipe(
        take(1),
        tap(() => this.chatService.changeCurrentDiscussion(discussion?._id))
      )
      .subscribe();
  }

  /**
   * close chat, save current discussion
   */
  doCloseChat(): void {
    this.chatService.changeCurrentDiscussion(null);
    // remove username item from currents field from current discussion closed, and patch
    this.chatRepositoryService
      .saveOpenedDiscussion(null, this.user)
      .pipe(
        take(1),
        tap(() => {
          this.currentPage = 1;
          this.allDiscussions = [];
          this.hasMoreDiscussions = true;
          this.loadingMore = false;
          this.chatService.pagination$.next({ page: this.currentPage, perPage: this.perPage });
          this.chatService.refreshAll();
        }),
        catchError((err) => doCatch('_doCloseChat', err, null))
      )
      .subscribe();
  }

  saveFilters(searchBox: ISearchModel, msgType: ChatMessageType): Observable<IChatInfos> {
    this.searchBox = searchBox;
    return this.chatService.getUser$().pipe(
      concatMap((user) => {
        const filters = this.searchService.searchModelToQueryParams(this.searchOptions, searchBox);
        lodash.set(filters, 'key_msg_type', msgType);
        lodash.set(filters, 'sort_type', this.storageSortKey);
        return this.chatRepositoryService.saveFilters(filters, user);
      })
    );
  }

  private saveKeys(): Observable<boolean> {
    // save in local storage
    const filters = this.searchService.searchModelToQueryParams(this.searchOptions, this.searchBox);
    lodash.set(filters, 'key_msg_type', filters?.key_msg_type ?? ChatMessageType.TRANSPORT);
    lodash.set(filters, 'sort_type', this.storageSortKey);
    return this.chatService.getUser$().pipe(
      tap((user) => (this.user = user)),
      concatMap((user) => this.chatRepositoryService.saveFilters(filters, user)),
      distinctUntilChanged(),
      tap((chatInfos) => {
        this.msgType = chatInfos?.filters?.key_msg_type;
        if (chatInfos?.filters?.sort_type) {
          this.storageSortKey = chatInfos.filters.sort_type;
          this.chatService.setSortType(this.storageSortKey);
        }
      }),
      map(() => true)
    );
  }

  /**
   * processing action event from unread button
   * @param ev
   */
  onActionEvent(ev: any): void {
    if (ev.action === 'close') {
      this.doCloseChat();
    }
  }

  doSendMassMessage(msgType: ChatMessageType): void {
    const isMRI = [ChatMessageType.REFUELING, ChatMessageType.WORKSHOP, ChatMessageType.HUMAN_RESOURCE].includes(msgType);
    this.chatMessagesMassModalService
      .showModal(isMRI)
      .pipe(
        takeUntil(this.destroy$),
        filter((b) => !!b),
        tap(() => this.chatWaitingService.showWaiting()),
        concatMap((text) => {
          const params: Params = this.searchService.searchModelToQueryParams(this.searchOptions, this.searchBox);
          return this.chatDiscussionsHttpService
            .searchDiscussions(
              {
                ...params,
                key_msg_type: msgType,
                carrier_id_from: ChatActorFrom.MOVEECAR_CARRIER
              } as IChatDiscussionSearchFilter,
              false,
              true
            )
            .pipe(
              map((res) => res.body),
              concatMap((discussions) =>
                from(discussions).pipe(
                  filter((b) => !!b),
                  mergeMap((discussion) => this.chatMessageService.sendMessage(ChatHelper.buildCreateSendMessage(discussion, text, msgType, this.user, ChatActorFrom.MOVEECAR_CARRIER))),
                  count(),
                  tap(() => this.doRefresh())
                )
              )
            );
        }),
        tap((num) => {
          this.chatWaitingService.hideWaiting();
          this.popupService.showSuccess('MASS_MESSAGE.SUCCESS', { messageParams: { number: num } });
        }),
        catchError((err) => {
          this.chatWaitingService.hideWaiting();
          this.popupService.showError('COMMON.ERROR_NO.43');
          return doCatch('ERROR_NO.43 lib chat _doSendMassMessage', err, null);
        })
      )
      .subscribe();
  }

  doChangeTypeDiscussion(msgType: ChatMessageType, discussions?: IChatDiscussion[]): void {
    this.chatWaitingService.showWaiting();
    this.msgType = ChatMessageType[msgType];
    this.currentPage = 1;
    this.allDiscussions = [];
    this.hasMoreDiscussions = true;
    this.chatService.pagination$.next({ page: 1, perPage: this.perPage });
    this.saveFilters(this.searchBox, msgType)
      .pipe(
        tap(() => {
          this.isChangingType = true;
          this.chatService.messageTypeSelected$.next(this.msgType);
          this.chatService.isChangingMessageType$.next(true);
          if (discussions?.some((d) => d?.key?.msg_type === msgType) && this.from === ChatActorFrom.MOVEECAR_DRIVER) {
            this.chatService.changeCurrentDiscussion(discussions?.find((d) => d?.key?.msg_type === msgType)?._id);
          }
        })
      )
      .subscribe();
  }

  onSendMessage(chatMessage: IChatMessage): void {
    this.sendMessageEvent.emit(chatMessage);
  }

  private initSearchModel(): Observable<ISearchModel> {
    return this.chatService.getUser$().pipe(
      concatMap((user) => this.chatRepositoryService.getFilters(user)),
      tap((filters) => {
        if (filters?.key_msg_type) {
          this.msgType = filters?.key_msg_type;
        }
        if (filters?.sort_type) {
          this.storageSortKey = filters.sort_type;
        }
      }),
      map((filters) => ({
        text: '',
        filters: lodash.omit(filters, ['key_msg_type', 'sort_type'])
      }))
    );
  }

  doChangeSort(sortType: string): void {
    this.storageSortKey = SortMessageType[sortType];
    this.chatService.setSortType(this.storageSortKey);
    this.chatService.refresh();
  }

  onScrollDiscussions(event: Event): void {
    const el = event.target as HTMLElement;
    const isScrollable = el.scrollHeight > el.clientHeight;
    if (this.currentPage === 1 && !isScrollable) return;

    // trigger when scrolled within 100px of the bottom (offset)
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      if (!this.loadingMore && this.hasMoreDiscussions) {
        if (this.scrollTimeout) {
          clearTimeout(this.scrollTimeout);
        }
        this.scrollTimeout = setTimeout(() => {
          this.loadMoreDiscussions();
        }, 200);
      }
    }
  }

  shouldShowLoadMoreButton(): boolean {
    // prevent blinking by adding stability checks
    if (!this.hasMoreDiscussions || this.loadingMore) {
      this.stableButtonState = false;
      return false;
    }

    const el = document.querySelector('.scroll-discussion') as HTMLElement;
    if (!el) {
      this.stableButtonState = false;
      return false;
    }

    const hasDiscussions = this.allDiscussions && this.allDiscussions.length > 0;
    if (!hasDiscussions) {
      this.stableButtonState = false;
      return false;
    }
    const contentHeight = el.scrollHeight;
    const containerHeight = el.clientHeight;

    const heightDifference = Math.abs(contentHeight - this.lastScrollHeight);
    const containerDifference = Math.abs(containerHeight - this.lastContainerHeight);

    const significantChange = heightDifference > 20 || containerDifference > 10;

    if (significantChange || this.lastScrollHeight === 0) {
      this.lastScrollHeight = contentHeight;
      this.lastContainerHeight = containerHeight;

      // use a small tolerance to account for browser differences
      const tolerance = 5;
      const hasScrolling = contentHeight > containerHeight + tolerance;

      this.stableButtonState = !hasScrolling;
    }

    return this.stableButtonState;
  }
}
