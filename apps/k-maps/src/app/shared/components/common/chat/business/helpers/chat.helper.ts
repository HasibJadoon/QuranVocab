import { IResource } from '@lib-shared/common/models/resource.model';
import { ResourceType } from '../../../models/domains/resource-type.domain';
import { catchError, concatMap, defaultIfEmpty, filter, last, map, mergeMap } from 'rxjs/operators';
import * as lodash from 'lodash';
import { doCatch } from '@lib-shared/common/helpers/error.helper';
import { GenericChatResourceHttpService } from '@lib-shared/common/models/generic-chat-resource-http.model';
import { User } from '@lib-shared/common/auth/models/user.model';
import { TranslateService } from '@ngx-translate/core';
import { IChatActor, IChatDiscussion, IChatUserResource } from '@lib-shared/common/chat/business/model/chat-discussion.model';
import { IResourceAssociation } from '@lib-shared/common/models/resources-association.model';
import { ChatMessageType } from '@lib-shared/common/chat/business/domains/chat-message-type.domain';
import { IChatEvent, IChatMessage, ILinkInfos, IMessageChunk } from '@lib-shared/common/chat/business/model/chat-message.model';
import { DateTime } from 'luxon';
import { from, Observable } from 'rxjs';
import { ChatActorFrom, ChatActorType } from '@lib-shared/common/chat/business/domains/chat-actor.domain';
import { McitCoreConfig } from '@lib-shared/common/helpers/provider.helper';
import { IRoadTransportOrder } from '@lib-shared/common/models/road-transport-order-model';
import { ChatAutomaticEvent } from '@lib-shared/common/chat/business/domains/chat-messages-auto.domain';
import { McitDateTranslatePipe } from '@lib-shared/common/common/pipes/date-translate.pipe';

export namespace ChatHelper {
  export function labelFullName(resource: IResource): string {
    return resource?.type === ResourceType.driver ? resource.driver?.first_name + ' ' + resource.driver?.last_name : resource.truck?.license_plate;
  }

  export function labelFullNameWithAssociate(resource: IResource, associated: IResource): string {
    let label = '';
    if (resource.type === ResourceType.driver) {
      label = resource.driver?.first_name + ' ' + resource.driver?.last_name;
      if (associated?.type === ResourceType.truck) {
        label += ' (' + associated.truck?.license_plate + '-' + associated.truck?.name + ')';
      }
    } else if (resource.type === ResourceType.truck) {
      label = resource.truck?.license_plate;
      if (associated?.type === ResourceType.driver) {
        label += ' (' + associated.driver?.first_name + ' ' + associated.driver?.last_name + ')';
      }
    }
    return label;
  }

  export function removeDriverAppUserAssociation(resourcesHttpService: GenericChatResourceHttpService, userName: string, disable: boolean, carrierId?: string, code?: string, resource?: IResource): Observable<IResource> {
    return resourcesHttpService.findResourceByUsername(userName, carrierId).pipe(
      filter((resources) => !!resources?.length),
      map((resources) => resources.filter((re) => re.code !== code)),
      concatMap((resources) =>
        from(resources).pipe(
          filter((r) => !!r),
          map((r) => ({
            ...lodash.omit(r, ['driver', 'driver_app_username']),
            ...(r?.driver?.first_name || r?.driver?.last_name
              ? {
                  driver: {
                    first_name: r?.driver?.first_name,
                    last_name: r?.driver?.last_name
                  }
                }
              : {}),
            ...{ disabled: disable }
          })),
          mergeMap((r) => resourcesHttpService.update(r._id, r)),
          defaultIfEmpty(null),
          last(),
          catchError((err) => doCatch('_removeDriverAppUserAssociation', err, null))
        )
      ),
      defaultIfEmpty(resource),
      map(() => resource)
    );
  }

  export function buildChatDiscussion(msgType: ChatMessageType, resource: IResource, associations: IResourceAssociation[], user: User, translateService: TranslateService): IChatDiscussion {
    const association: IResourceAssociation = associations && associations.length > 0 ? associations[0] : null;
    const resourceAssociated = association ? association.resources.filter((re) => re._id !== resource._id)?.[0] : null;

    return {
      key: {
        carrier_id: user?.apps?.driver?.context?.carrier?.id,
        resource_id: resource?._id,
        msg_type: msgType
      },
      group: [
        {
          type: ChatActorType.chat_user,
          from: ChatActorFrom.MOVEECAR_DRIVER,
          entity_id: user?.apps?.driver?.context?.carrier?.id,
          entity_name: user?.apps?.driver?.context?.carrier?.name,
          username: user?.username,
          driver_chat_roles: user?.apps?.driver?.roles?.filter((role) => role.includes('driver_chat')),
          contact: {
            name: ChatHelper.labelFullName(resource),
            email: user?.email,
            phone: user?.phone,
            language: translateService.currentLang
          },
          resource: buildChatUserResource(resource, resourceAssociated)
        },
        {
          type: ChatActorType.chat_entity,
          from: ChatActorFrom.MOVEECAR_CARRIER,
          entity_id: resource?.carrier_id,
          entity_name: user?.apps?.driver?.context?.carrier?.name
        }
      ],
      tags: lodash.compact(lodash.concat(resource?.tags, resourceAssociated?.tags))
    };
  }

  export function buildChatUserResource(resource: IResource, resourceAssociated?: IResource): IChatUserResource {
    return {
      resource_id: resource?._id,
      code: resource?.code,
      type: resource?.type,
      label_full_name_with_associated: ChatHelper.labelFullNameWithAssociate(resource, resourceAssociated),
      mre_provider: {
        third_party_id: resource?.provider?.third_party_id,
        name: resource?.provider?.name
      },
      associated: resourceAssociated ? buildChatUserResource(resourceAssociated) : undefined
    };
  }

  export function buildChatInterpolateParams(rto: IRoadTransportOrder, event: ChatAutomaticEvent, dateTranslatePipe: McitDateTranslatePipe, manifestIdOrNo?: string): { [key: string]: string } {
    let interParams;
    const manifest = manifestIdOrNo ? rto?.manifests?.find((manif) => manif._id === manifestIdOrNo || manif?.manifest_no === manifestIdOrNo) : lodash.head(rto?.manifests || []);
    const name = rto?.order_no + (rto?.x_order_no ? ` (${rto?.x_order_no})` : '');
    switch (event) {
      case ChatAutomaticEvent.ALLOCATION:
      case ChatAutomaticEvent.PLANNED_DATE_CHANGE:
        interParams = {
          planned_date: dateTranslatePipe.transform(DateTime.fromISO(rto.start.planned_date), 'date'),
          planned_time: dateTranslatePipe.transform(DateTime.fromISO(rto.start.planned_time), 'hour_minutes')
        };
        break;
      case ChatAutomaticEvent.UNALLOCATION:
        interParams = {};
        break;
      case ChatAutomaticEvent.START_RTO:
        interParams = {
          name
        };
        break;
      case ChatAutomaticEvent.START_PICKUP:
      case ChatAutomaticEvent.END_PICKUP:
        interParams = {
          step: manifest?.pickup?.member_role?.name,
          name
        };
        break;
      case ChatAutomaticEvent.START_DELIVERY:
      case ChatAutomaticEvent.END_DELIVERY:
        interParams = {
          step: manifest?.delivery?.member_role?.name,
          name
        };
        break;
      default:
        break;
    }
    return interParams;
  }

  export function buildCreateSendMessage(
    discussion: IChatDiscussion,
    text: string,
    type: ChatMessageType,
    user: User,
    createdFrom: ChatActorFrom,
    extras?: {
      event?: IChatEvent;
      link_infos?: ILinkInfos;
      text_splitted_with_contacts?: IMessageChunk[];
    }
  ): IChatMessage {
    const date = DateTime.local().toISO();
    return {
      discussion_id: discussion?._id,
      text,
      type,
      sender: {
        actor: discussion?.group.find((d) => d?.from === createdFrom),
        sent_date: { date },
        sent_by: lodash.compact([user?.firstname, user?.lastname]).join(' '),
        sent_from: createdFrom,
        sent_by_username: user?.username,
        sent_by_email: user?.email
      },
      receiver: extras?.event
        ? {
            actor: discussion?.group.find((d) => d?.from !== createdFrom),
            read_date: { date }
          }
        : { actor: discussion?.group.find((d) => d?.from !== createdFrom) },
      event: extras?.event,
      link_infos: extras?.link_infos,
      text_splitted_with_contacts: extras?.text_splitted_with_contacts
    };
  }

  /**
   * find the typed word after symbole @
   * @param inputValue
   * @param separator
   * @param msgAt
   */
  export function findTheTypedWordAfterSymboleAt(inputValue: string, separator: string): string {
    if (lodash.includes(inputValue, separator)) {
      const indexOfAt = findIndexOfAt(inputValue, separator);
      if (indexOfAt > -1) {
        const indexOfSpace = inputValue.indexOf(' ', indexOfAt) > -1 ? inputValue.indexOf(' ', indexOfAt) : undefined;
        return inputValue.slice(indexOfAt, indexOfSpace);
      }
    }
    return undefined;
  }

  export function buildInputValueAt(value: string, atWord: string): string {
    const word = findTheTypedWordAfterSymboleAt(value, '@');
    const indexOfAt = findIndexOfAt(value, '@');
    const substringAfterIndexAt = value.slice(indexOfAt);
    const substringBeforeIndexAt = value.slice(0, indexOfAt);
    return `${substringBeforeIndexAt}${substringAfterIndexAt.replace(`${word}`, atWord)}`;
  }

  /**
   * find word between ' at the specified index.
   * @param inputValue the current input value
   * @param indexMax
   */
  export function findWordToDelete(inputValue: string, indexMax: number): string {
    const substringWord = inputValue.substring(0, indexMax - 1);
    const indexLast = substringWord.lastIndexOf("'");
    return inputValue.substring(indexLast, indexMax);
  }

  /**
   * find index of the symbole @
   * @param inputValue
   * @param separator
   * @param start
   */
  export function findIndexOfAt(inputValue: string, separator: string, start?: number): number {
    const array = inputValue.slice(start).split('');
    return array.findIndex((element, index) => {
      if (element === separator) {
        return index === 0 ? true : array[index - 1] !== "'";
      }
      return false;
    });
  }

  /**
   * split input by space
   * @param messagesWithAt
   * @param text
   */
  export function splitMessage(messagesWithAt: IMessageChunk[], text: string): IMessageChunk[] {
    return text.split(' ').map((word) => {
      const atWord = messagesWithAt.find((at) => at.word === word);
      return atWord ? atWord : { word };
    });
  }

  /**
   * return true if character after symbole @ is space.
   * @param input
   */
  export function isSpaceAfterSymboleAt(input: string): boolean {
    const indexOfAt = findIndexOfAt(input, '@');
    return input.slice(indexOfAt + 1) === ' ';
  }

  export function findActor(discussion: IChatDiscussion, fromActor: ChatActorFrom): IChatActor | undefined {
    return discussion?.group?.find((act) => act?.from === fromActor);
  }

  /**
   * Check if _user is authorized to use chat
   * @param user
   * @param config
   * @private
   */
  export function isAuthorizedToUseChat(user: User, config: McitCoreConfig): boolean {
    const roles = user?.apps?.[config.app]?.roles ?? [];
    const chat = ['driver_chat', 'chat'].some((key) => roles.includes(key));
    return user != null && chat && user.apps?.[config.app]?.context?.carrier?.id && !!user.username;
  }
}
