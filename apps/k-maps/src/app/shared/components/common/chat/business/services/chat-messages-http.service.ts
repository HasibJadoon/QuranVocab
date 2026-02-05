import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { IChatMessage } from '../model/chat-message.model';
import { Observable } from 'rxjs';
import { McitCoreEnv } from '../../../helpers/provider.helper';
import { ChatMessageType } from '../domains/chat-message-type.domain';
import * as lodash from 'lodash';
import { ILocalDate } from '@lib-shared/common/models/types.model';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';

@TraceErrorClass()
@Injectable({
  providedIn: 'root'
})
export class McitChatMessagesHttpService {
  constructor(private httpClient: HttpClient, private env: McitCoreEnv) {}

  search(discussionId: string, msgType: ChatMessageType, withEventMsg: boolean, q: string, page: number, per_page: number, sort: string, fields: string): Observable<HttpResponse<IChatMessage[]>> {
    return this.httpClient.get<IChatMessage[]>(`${this.env.apiUrl}/v2/common/private/chat/message`, {
      params: lodash.omitBy(
        {
          discussion_id: discussionId,
          msg_type: msgType,
          with_event_messages: withEventMsg ?? true,
          q,
          page,
          per_page,
          sort,
          fields
        },
        lodash.isNil
      ),
      observe: 'response'
    });
  }

  findByDiscussionId(discussionId: string, page?: number, msgType?: ChatMessageType, withEventMsg?: boolean): Observable<HttpResponse<IChatMessage[]>> {
    return this.search(discussionId, msgType, withEventMsg, '', page ?? 1, 20, '-created_date', '');
  }

  findParticipantsUsernames(discussionId: string): Observable<string[]> {
    return this.httpClient.get<string[]>(`${this.env.apiUrl}/v2/common/private/chat/message/participants?discussionId=${discussionId}`);
  }

  create(chatMessage: IChatMessage): Observable<IChatMessage> {
    return this.httpClient.post<IChatMessage>(`${this.env.apiUrl}/v2/common/private/chat/message`, chatMessage);
  }

  update(id: string, chatMessage: IChatMessage): Observable<IChatMessage> {
    return this.httpClient.put<IChatMessage>(`${this.env.apiUrl}/v2/common/private/chat/message/${id}`, chatMessage);
  }

  updateManyReadStatusMessages(reads: { ids: string[]; read_date?: ILocalDate }): Observable<IChatMessage> {
    return this.httpClient.post<IChatMessage>(`${this.env.apiUrl}/v2/common/private/chat/message/many-read-status`, reads);
  }
}
