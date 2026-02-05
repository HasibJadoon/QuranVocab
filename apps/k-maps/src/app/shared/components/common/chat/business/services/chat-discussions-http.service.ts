import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { IChatDiscussion, IChatDiscussionKey, IChatDiscussionSearchFilter } from '../model/chat-discussion.model';
import { concatMap, map } from 'rxjs/operators';
import * as lodash from 'lodash';
import { Params } from '@angular/router';
import { IResource } from '@lib-shared/common/models/resource.model';
import { McitCoreEnv } from '@lib-shared/common/helpers/provider.helper';
import { ChatHelper } from '@lib-shared/common/chat/business/helpers/chat.helper';
import { ChatActorFrom } from '@lib-shared/common/chat/business/domains/chat-actor.domain';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';

@TraceErrorClass()
@Injectable({
  providedIn: 'root'
})
export class McitChatDiscussionsHttpService {
  constructor(private httpClient: HttpClient, private environment: McitCoreEnv) {}

  searchDiscussions(filters: IChatDiscussionSearchFilter | Params, withAggregate: boolean, withKeyMsgType?: boolean): Observable<HttpResponse<IChatDiscussion[]>> {
    return this.httpClient.get<IChatDiscussion[]>(`${this.environment.apiUrl}/v2/common/private/chat/discussion`, {
      params: lodash.omitBy(
        {
          ...lodash.omit(filters, withKeyMsgType ? ['tags'] : ['tags', 'key_msg_type']),
          tags: Array.isArray(filters.tags) ? filters.tags?.join(',') : filters?.tags,
          costs_types: Array.isArray(filters.costs_types) ? filters.costs_types?.join(',') : filters?.costs_types,
          with_aggregate: withAggregate
        },
        lodash.isNil
      ),
      observe: 'response'
    });
  }

  findDiscussionById(discussionId: string): Observable<IChatDiscussion> {
    return this.httpClient.get<IChatDiscussion>(`${this.environment.apiUrl}/v2/common/private/chat/discussion/${discussionId}`);
  }

  findDiscussionByDiscussionKey(key: IChatDiscussionKey, withAggregate?: boolean, sort?: string): Observable<IChatDiscussion> {
    return this.httpClient.get<IChatDiscussion>(`${this.environment.apiUrl}/v2/common/private/chat/discussion/key`, {
      params: lodash.omitBy(
        {
          ...key,
          with_aggregate: withAggregate,
          sort
        },
        lodash.isNil
      )
    });
  }

  createDiscussion(discussion: IChatDiscussion): Observable<IChatDiscussion> {
    return this.httpClient.post<IChatDiscussion>(`${this.environment.apiUrl}/v2/common/private/chat/discussion`, discussion);
  }

  updateDiscussion(discussionId: string, discussion: IChatDiscussion): Observable<IChatDiscussion> {
    discussion.tags = lodash.compact(discussion.tags);
    return this.httpClient.put<IChatDiscussion>(`${this.environment.apiUrl}/v2/common/private/chat/discussion/${discussionId}`, discussion);
  }

  findAndUpdateDiscussionResourceAndTags(resource: IResource, associated: IResource): Observable<boolean> {
    if (!resource) {
      return of(null);
    }
    const tags: string[] = lodash.compact(lodash.concat(resource?.tags, associated?.tags));
    return this.searchDiscussions(
      {
        key_resource_id: resource._id,
        key_carrier_id: resource?.carrier_id,
        page: 1,
        per_page: 0
      },
      false
    ).pipe(
      map((res) => res?.body),
      concatMap((discussions) => {
        if (!discussions.length) {
          return of(null);
        }
        return forkJoin([
          ...discussions.map((discussion) =>
            discussion
              ? this.updateDiscussion(discussion._id, {
                  ...discussion,
                  group: discussion.group.map((actor) => {
                    if (actor?.from === ChatActorFrom.MOVEECAR_DRIVER) {
                      actor = { ...actor, resource: ChatHelper.buildChatUserResource(resource, associated) };
                    }
                    return actor;
                  }),
                  tags
                })
              : of(null)
          )
        ]);
      }),
      map(() => true)
    );
  }

  getUnreadMessagesOrDiscussionsCount(filters: IChatDiscussionSearchFilter | Params, withAggregate: boolean, withKeyMsgType?: boolean): Observable<{ [key: string]: number }> {
    return this.httpClient.get<{ total: number }>(`${this.environment.apiUrl}/v2/common/private/chat/discussion/unread`, {
      params: lodash.omitBy(
        {
          ...lodash.omit(filters, withKeyMsgType ? ['tags'] : ['tags', 'key_msg_type']),
          tags: Array.isArray(filters.tags) ? filters.tags?.join(',') : filters?.tags,
          costs_types: Array.isArray(filters.costs_types) ? filters.costs_types?.join(',') : filters?.costs_types,
          with_aggregate: withAggregate
        },
        lodash.isNil
      )
    });
  }
}
