import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { McitSocketService } from '../../business/services/socket.service';
import { catchError, concatMap, defaultIfEmpty, filter, last, map, take, tap } from 'rxjs/operators';
import * as lodash from 'lodash';
import { IChatEvent, IChatMessage, ILinkInfos, IMessageChunk, IChatTextAuto } from '../../business/model/chat-message.model';
import { McitChatMessagesHttpService } from '../../business/services/chat-messages-http.service';
import { ChatMessageType } from '../../business/domains/chat-message-type.domain';
import { doCatch } from '../../../helpers/error.helper';
import { IResource } from '@lib-shared/common/models/resource.model';
import { DateTime } from 'luxon';
import { ChatAutomaticEvent } from '@lib-shared/common/chat/business/domains/chat-messages-auto.domain';
import { TranslateService } from '@ngx-translate/core';
import { McitChatUtilsHttpService } from '@lib-shared/common/chat/business/services/chat-utils-http.service';
import { McitChatService } from '@lib-shared/common/chat/business/services/chat.service';
import { ISocketNewMessageSent, SocketEventNames } from '@lib-shared/common/chat/business/domains/socket-event-name.domain';
import { IRoadTransportOrder } from '@lib-shared/common/models/road-transport-order-model';
import { ChatActorFrom } from '@lib-shared/common/chat/business/domains/chat-actor.domain';
import { McitDateTranslatePipe } from '@lib-shared/common/common/pipes/date-translate.pipe';
import { McitChatDiscussionsHttpService } from '@lib-shared/common/chat/business/services/chat-discussions-http.service';
import { ChatHelper } from '@lib-shared/common/chat/business/helpers/chat.helper';
import { McitChatDiscussionService } from '@lib-shared/common/chat/components/chat-discussion/chat-discussion.service';
import { McitCoreConfig, McitCoreEnv } from '@lib-shared/common/helpers/provider.helper';
import { McitStorage } from '@lib-shared/common/storage/mcit-storage';
import { McitDateTimeService } from '@lib-shared/common/services/date-time.service';

export interface IDataMessageAuto {
  text?: string;
  type: ChatMessageType;
  created_from: ChatActorFrom;
  event?: IChatEvent;
  link_infos?: ILinkInfos;
  text_splitted_with_contacts?: IMessageChunk[];
  fill_read_date?: boolean;
}

@Injectable()
export class McitChatMessagesService {
  private readonly dateTranslatePipe: McitDateTranslatePipe;

  constructor(
    private socketService: McitSocketService,
    private storage: McitStorage,
    private messagesHttpService: McitChatMessagesHttpService,
    private translateService: TranslateService,
    private dateTimeService: McitDateTimeService,
    private chatUtilsHttpService: McitChatUtilsHttpService,
    private chatService: McitChatService,
    private chatDiscussionsHttpService: McitChatDiscussionsHttpService,
    private chatDiscussionService: McitChatDiscussionService,
    private config: McitCoreConfig,
    private env: McitCoreEnv
  ) {
    this.dateTranslatePipe = new McitDateTranslatePipe(this.translateService, this.dateTimeService, undefined);
  }

  sendMessage(chatMessage: IChatMessage): Observable<IChatMessage> {
    if (this.env.disableChat) {
      return of(null);
    }

    if (!chatMessage?.text && !chatMessage?.event?.text_auto?.text) {
      return of(null);
    }

    return this.messagesHttpService.create(chatMessage).pipe(tap((chatMsg) => this.socketService.emit<ISocketNewMessageSent>(SocketEventNames.NEW_MESSAGE_SENT, chatMsg)));
  }

  sendMessageAuto(msgAuto: IDataMessageAuto, resourceUsed?: IResource): Observable<boolean> {
    if (this.env.disableChat) {
      return of(null);
    }
    return this.chatService
      .getUser$()
      .pipe(take(1))
      .pipe(
        filter((user) => ChatHelper.isAuthorizedToUseChat(user, this.config)),
        concatMap((user) =>
          (resourceUsed ? of(resourceUsed) : this.chatUtilsHttpService.findResourceByUsername(msgAuto.created_from)).pipe(
            concatMap((resource) => this.chatDiscussionService.findDiscussionOrCreateMany(resource, msgAuto?.type)),
            concatMap((discussionAndResource) => from(discussionAndResource)),
            concatMap(({ resource, discussion }) => {
              const chatMessage = ChatHelper.buildCreateSendMessage(discussion, msgAuto?.text, msgAuto.type, user, msgAuto.created_from, {
                event: msgAuto.event,
                link_infos: msgAuto?.link_infos
              });
              return this.sendMessage(chatMessage).pipe(
                tap(() => this.chatService.refresh()),
                map(() => true)
              );
            }),
            defaultIfEmpty(null)
          )
        ),
        defaultIfEmpty(false)
      );
  }

  sendMessageAutoFromRto(event: ChatAutomaticEvent, rto: IRoadTransportOrder, resourceId: string): Observable<boolean> {
    if (this.env.disableChat) {
      return of(null);
    }

    if (!rto || !resourceId || !lodash.values(ChatAutomaticEvent).includes(event)) {
      return of(null);
    }
    return this.chatService
      .getUser$()
      .pipe(take(1))
      .pipe(
        filter((user) => ChatHelper.isAuthorizedToUseChat(user, this.config)),
        concatMap(() => this.chatUtilsHttpService.getResource(resourceId, rto.carrier_id).pipe(concatMap((resource) => this.chatDiscussionService.findDiscussionOrCreateMany(resource, ChatMessageType.TRANSPORT)))),
        concatMap((discussionAndResource) => from(discussionAndResource)),
        concatMap(({ discussion, resource }) => {
          const textAuto: IChatTextAuto = {
            text: 'CHAT.MESSAGES_AUTO.' + event,
            interpolate_params: ChatHelper.buildChatInterpolateParams(rto, event, this.dateTranslatePipe)
          };
          return this.sendMessageAuto(
            {
              type: ChatMessageType.TRANSPORT,
              created_from: ChatActorFrom.MOVEECAR_CARRIER,
              event: {
                type: event,
                text_auto: textAuto,
                event_date: {
                  date: DateTime.local().toISO()
                }
              },
              link_infos: this.buildLinkInfos(event, rto)
            },
            resource
          );
        }),
        defaultIfEmpty(null),
        last(),
        defaultIfEmpty(true),
        tap(() => this.chatService.refresh()),
        catchError((err) => doCatch('_sendMessageAutoFromRto', err, null))
      );
  }

  private buildLinkInfos(event: ChatAutomaticEvent, rto: IRoadTransportOrder): ILinkInfos {
    let linkInfos: ILinkInfos;

    switch (event) {
      case ChatAutomaticEvent.ALLOCATION:
        linkInfos = {
          title: {
            text: 'CHAT.NOTIFICATION.ASSIGNEMENT_UPDATE'
          },
          rto_no: rto.order_no
        };
        break;
      case ChatAutomaticEvent.PLANNED_DATE_CHANGE:
        const waypoints = lodash.compact(lodash.initial(rto.route)?.map((segment) => segment?.end?.member_role?.city));
        linkInfos = {
          title: {
            text: 'CHAT.NOTIFICATION.ASSIGNEMENT',
            interpolate_params: {
              start_city: lodash.head(waypoints),
              end_city: lodash.last(waypoints)
            }
          },
          rto_no: rto.order_no
        };
        break;
      default:
        break;
    }
    return linkInfos;
  }
}
