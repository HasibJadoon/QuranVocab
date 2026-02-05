import { Injectable } from '@angular/core';
import { IResourceAssociation } from '@lib-shared/common/models/resources-association.model';
import { from, Observable, of } from 'rxjs';
import { IChatDiscussion } from '@lib-shared/common/chat/business/model/chat-discussion.model';
import { IResource } from '@lib-shared/common/models/resource.model';
import { McitChatDiscussionsHttpService } from '@lib-shared/common/chat/business/services/chat-discussions-http.service';
import { catchError, concatMap, defaultIfEmpty, filter, map, switchMap, tap, toArray } from 'rxjs/operators';
import { DateTime } from 'luxon';
import { Period } from '@lib-shared/common/models/domains/period.domain';
import { ChatHelper } from '@lib-shared/common/chat/business/helpers/chat.helper';
import { McitChatUtilsHttpService } from '@lib-shared/common/chat/business/services/chat-utils-http.service';
import { TranslateService } from '@ngx-translate/core';
import { ChatMessageType } from '@lib-shared/common/chat/business/domains/chat-message-type.domain';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';
import { doCatch } from '@lib-shared/common/helpers/error.helper';

@TraceErrorClass()
@Injectable()
export class McitChatDiscussionService {
  constructor(
    private discussionsHttpService: McitChatDiscussionsHttpService,
    private chatDiscussionsHttpService: McitChatDiscussionsHttpService,
    private chatUtilsHttpService: McitChatUtilsHttpService,
    private translateService: TranslateService
  ) {}

  updateDiscussionBelongsToAssociation(resources: IResource[]): Observable<boolean> {
    // Filter prioritized resources (with driver_app_username) and non-prioritized resources (without driver_app_username)
    const prioritizedResources = resources?.filter((resource) => resource?.driver_app_username);
    const nonPrioritizedResources = resources?.filter((resource) => !resource?.driver_app_username);
    // Create pairs for prioritized resources
    const orderedPrioritizedResources = prioritizedResources?.map((res1) => [res1, resources?.find((res2) => res1?._id !== res2?._id)]);
    // Create pairs for non-prioritized resources
    const orderedNonPrioritizedResources = nonPrioritizedResources?.map((res1) => [res1, resources?.find((res2) => res1?._id !== res2?._id)]);

    return from([...orderedPrioritizedResources, ...orderedNonPrioritizedResources]).pipe(
      concatMap(([resource1, resource2]) => this.discussionsHttpService.findAndUpdateDiscussionResourceAndTags(resource1, resource2)),
      defaultIfEmpty(true)
    );
  }

  findDiscussionOrCreateMany(
    resource: IResource,
    msgType: ChatMessageType
  ): Observable<
    {
      resource: IResource;
      discussion: IChatDiscussion;
    }[]
  > {
    const dateToSet = DateTime.fromJSDate(new Date());
    const periodToSet = dateToSet.hour >= 12 ? Period.AFTERNOON : Period.MORNING;
    return this.chatUtilsHttpService
      .searchResourceAssociation({
        carrier_id: resource?.carrier_id,
        resource_id: resource?._id,
        start_date: dateToSet.toISODate(),
        end_date: dateToSet.toISODate(),
        start_period: periodToSet,
        end_period: periodToSet
      })
      .pipe(
        concatMap((associations) => {
          const resourcesWithDriverApp = associations?.length ? associations?.[0]?.resources?.filter((res) => res?.driver_app_username?.length) : resource?.driver_app_username?.length ? [resource] : [];

          return resourcesWithDriverApp?.length
            ? from(resourcesWithDriverApp).pipe(
                concatMap((resourceWithDriverApp) =>
                  this.chatDiscussionsHttpService
                    .findDiscussionByDiscussionKey({
                      resource_id: resourceWithDriverApp?._id,
                      carrier_id: resourceWithDriverApp?.carrier_id,
                      msg_type: msgType
                    })
                    .pipe(
                      concatMap((discussion) => {
                        if (discussion) {
                          return of(discussion);
                        } else {
                          return this.chatUtilsHttpService.getUserFromUsername(resourceWithDriverApp?.driver_app_username).pipe(
                            filter((user) => resourceWithDriverApp?.carrier_id === user?.apps?.driver?.context?.carrier?.id),
                            switchMap((user) => this.chatDiscussionsHttpService.createDiscussion(ChatHelper.buildChatDiscussion(msgType, resourceWithDriverApp, associations, user, this.translateService))),
                            defaultIfEmpty(null),
                            catchError((err) => doCatch('createDiscussion', err, null))
                          );
                        }
                      }),
                      tap((discussion) => {
                        if (!discussion?._id) {
                          throw new Error('discussion not found and unable to create one for resource');
                        }
                      }),
                      map((discussion) => ({ discussion, resource: resourceWithDriverApp }))
                    )
                ),
                toArray()
              )
            : of([]);
        })
      );
  }
}
