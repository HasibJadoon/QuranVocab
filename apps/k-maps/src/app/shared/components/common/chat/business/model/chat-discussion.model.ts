import { ILocalDate, ITracable } from '@lib-shared/common/models/types.model';
import { IInfoContact } from '@lib-shared/common/models/info-contact.model';
import { ResourceType } from '@lib-shared/common/models/domains/resource-type.domain';
import { ChatAutomaticEvent } from '@lib-shared/common/chat/business/domains/chat-messages-auto.domain';
import { ChatMessageType } from '@lib-shared/common/chat/business/domains/chat-message-type.domain';
import { ChatActorFrom, ChatActorType } from '@lib-shared/common/chat/business/domains/chat-actor.domain';
import { IChatEvent } from '@lib-shared/common/chat/business/model/chat-message.model';

export enum SortMessageType {
  UNREAD_ON_TOP = 'UNREAD_ON_TOP',
  LATEST_ON_TOP = 'LATEST_ON_TOP'
}

export interface IChatDiscussion extends ITracable {
  _id?: string;
  // clé de regroupement d'une discussion
  key: IChatDiscussionKey;
  // tags liés à la discussion
  tags?: string[];
  // groupe de discussion
  group?: IChatActor[];

  /* données récupérées d'une aggrégation, non enregistrées en base */
  last_messages?: ILastMessage[];
  last_events?: ILastMessage[];
  unread_messages?: IUnRead[];
}

export interface IChatDiscussionKey {
  resource_id: string;
  carrier_id?: string;
  msg_type: ChatMessageType;
}

export interface IChatActor {
  // type de l'acteur
  type: ChatActorType;
  // provenance (logiciel ou topic spécialisé) de l'acteur
  from: ChatActorFrom;
  // id de l'entité
  entity_id: string;
  // nom de l'entité
  entity_name: string;

  /* infos spécifiques au chat_user*/
  // nom d'utilisateur
  username?: string;
  // contact
  contact?: IInfoContact;
  // resource type
  resource?: IChatUserResource;
  // role de l'user
  driver_chat_roles?: string[];
}

export interface ILastMessage {
  msg_type: ChatMessageType;
  text: string;
  created_date: Date;
  event?: IChatEvent;
}

export interface IUnRead {
  msg_type: ChatMessageType;
  sent_from: ChatActorFrom;
  total: number;
}

export interface IChatUserResource {
  // id de la resource
  resource_id: string;
  // code de la resource
  code: string;
  // type de la resource
  type: ResourceType;
  // mre infos
  mre_provider?: {
    // id de l'entité
    third_party_id?: string;
    // nom de l'entité
    name?: string;
  };
  // label de la resource avec sa resource associée
  label_full_name_with_associated?: string;
  associated: IChatUserResource;
}

export interface IChatDiscussionSearchFilter {
  q?: string;
  page?: number;
  per_page?: number;
  sort?: string;
  sort_type?: SortMessageType;
  fields?: string;

  key_resource_id?: string;
  key_resource_ids?: string[];
  key_carrier_id?: string;
  key_msg_type?: ChatMessageType;
  tags?: string[];
  costs_types: string[];

  carrier_id_from?: ChatActorFrom;
  only_unread_messages_count?: boolean;
}
