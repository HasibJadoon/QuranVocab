import { Injectable } from '@angular/core';
import * as lodash from 'lodash';
import { Observable, of } from 'rxjs';
import { concatMap, map, tap } from 'rxjs/operators';
import { User } from '@lib-shared/common/auth/models/user.model';
import { IFiltersModel } from '@lib-shared/common/search/search-model';
import { IChatMessage } from '@lib-shared/common/chat/business/model/chat-message.model';
import { ChatMessageType } from '@lib-shared/common/chat/business/domains/chat-message-type.domain';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';
import { McitStorage } from '@lib-shared/common/storage/mcit-storage';
import { IChatDiscussion, SortMessageType } from '@lib-shared/common/chat/business/model/chat-discussion.model';

export interface IChatInfosFilters {
  q?: string;
  tags?: string[];
  key_msg_type?: ChatMessageType;
  sort_type?: SortMessageType;
}

export interface IChatInfos {
  discussions: {
    [idDiscussion: string]: {
      draftMessage: string;
      messages: IChatMessage[];
    };
  };
  filters?: IChatInfosFilters;
  opened_discussion_id?: string;
  current_discussion_id?: string;
  show_auto_messages?: boolean;
  all_discussions?: IChatDiscussion[];
}

@TraceErrorClass()
@Injectable({
  providedIn: 'root'
})
export class McitChatRepositoryService {
  private readonly CHAT_INFOS_KEY = 'chat-infos';
  private chatInfos: IChatInfos;

  constructor(private storage: McitStorage) {}

  getChatInfos(user: User): Observable<IChatInfos> {
    if (this.chatInfos) {
      return of(this.chatInfos);
    }

    return this.storage.get(this.buildChatInfosKey(user)).pipe(
      map((chatInfos) => chatInfos ?? this.buildChatInfosEmpty()),
      tap((chatInfos) => (this.chatInfos = chatInfos))
    );
  }

  getMessages(user: User, discussionId: string): Observable<IChatMessage[]> {
    return this.getChatInfos(user).pipe(map((chatInfos) => chatInfos?.discussions?.[discussionId]?.messages));
  }

  getDiscussions(user: User): Observable<IChatDiscussion[]> {
    return this.getChatInfos(user).pipe(map((chatInfos) => chatInfos?.all_discussions));
  }

  getFilters(user: User): Observable<IChatInfosFilters> {
    return this.getChatInfos(user).pipe(map((chatInfos) => chatInfos?.filters));
  }

  saveFilters(filters: IFiltersModel, user: User): Observable<IChatInfos> {
    return this.getChatInfos(user).pipe(
      concatMap((chatInfos) => {
        lodash.set(chatInfos, 'filters', filters);
        this.chatInfos = chatInfos;
        return this.storage.set(this.buildChatInfosKey(user), chatInfos);
      })
    );
  }
  saveOpenedDiscussion(discussionId: string, user: User): Observable<IChatInfos> {
    return this.getChatInfos(user).pipe(
      concatMap((chatInfos) => {
        lodash.set(chatInfos, 'opened_discussion_id', discussionId);
        this.chatInfos = chatInfos;
        return this.storage.set(this.buildChatInfosKey(user), chatInfos);
      })
    );
  }

  saveCurrentDiscussion(discussionId: string, user: User): Observable<IChatInfos> {
    return this.getChatInfos(user).pipe(
      concatMap((chatInfos) => {
        lodash.set(chatInfos, 'current_discussion_id', discussionId);
        this.chatInfos = chatInfos;
        return this.storage.set(this.buildChatInfosKey(user), chatInfos);
      })
    );
  }

  saveShowAutoMessages(showAutoMsg: boolean, user: User): Observable<IChatInfos> {
    return this.getChatInfos(user).pipe(
      concatMap((chatInfos) => {
        lodash.set(chatInfos, 'show_auto_messages', showAutoMsg);
        this.chatInfos = chatInfos;
        return this.storage.set(this.buildChatInfosKey(user), chatInfos);
      })
    );
  }

  saveDraftMessage(message: string, discussionId: string, user?: User): Observable<boolean> {
    return this.getChatInfos(user).pipe(
      concatMap((chatInfos) => {
        lodash.set(chatInfos, `discussions.${discussionId}.draftMessage`, message);
        this.chatInfos = chatInfos;
        return this.storage.set(this.buildChatInfosKey(user), chatInfos);
      })
    );
  }

  saveMessages(messages: IChatMessage[], discussionId: string, user?: User): Observable<boolean> {
    return this.getChatInfos(user).pipe(
      concatMap((chatInfos) => {
        lodash.set(chatInfos, `discussions.${discussionId}.messages`, messages);
        this.chatInfos = chatInfos;
        return this.storage.set(this.buildChatInfosKey(user), chatInfos);
      })
    );
  }

  saveDiscussions(discussions: IChatDiscussion[], user?: User): Observable<boolean> {
    return this.getChatInfos(user).pipe(
      concatMap((chatInfos) => {
        lodash.set(chatInfos, `all_discussions`, discussions);
        this.chatInfos = chatInfos;
        return this.storage.set(this.buildChatInfosKey(user), chatInfos);
      })
    );
  }

  destroy(): void {}

  private buildChatInfosKey(user?: User): string {
    return this.CHAT_INFOS_KEY + '_' + user?.username;
  }

  private buildChatInfosEmpty(): IChatInfos {
    return {
      discussions: {}
    };
  }
}
