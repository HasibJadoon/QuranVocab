import { ILocalDate, ITracable } from '@lib-shared/common/models/types.model';
import { ChatAutomaticEvent } from '@lib-shared/common/chat/business/domains/chat-messages-auto.domain';
import { IChatActor } from '@lib-shared/common/chat/business/model/chat-discussion.model';
import { ChatMessageType } from '@lib-shared/common/chat/business/domains/chat-message-type.domain';
import { IInfoContact } from '@lib-shared/common/models/info-contact.model';
import { ChatActorFrom } from '@lib-shared/common/chat/business/domains/chat-actor.domain';

export interface IChatTextAuto {
  text: string;
  interpolate_params?: any;
}

export interface IChatMessage extends ITracable {
  _id?: string;
  // id de la discussion
  discussion_id: string;
  // texte du message
  text?: string;
  // type du message
  type: ChatMessageType;
  // infos sur l'emétteur
  sender: ISender;
  // infos sur réceptionnaire
  receiver: IReceiver;
  // evenement lié au message
  event?: IChatEvent;
  // if is notification we need to know the title and text to build specific link
  link_infos?: ILinkInfos;
  // message découpé pour identifier les utilisateurs taggués avec @
  text_splitted_with_contacts?: IMessageChunk[];

  // infos sur l'emétteur
  // senders?: ISender[];
  // // infos sur réceptionnaire
  // receivers?: IReceiver[];
}

export interface ISender {
  // acteur de la conversation
  actor: IChatActor;
  // date d'envoi du message
  sent_date: ILocalDate;
  // envoyé par Nom Prénom
  sent_by: string;
  // evoyé depuis
  sent_from: ChatActorFrom;
  // nom de l'utilisateur qui a envoyé le message
  sent_by_username: string;
  // mail de l'utilisateur qui a envoyé le message
  sent_by_email: string;
}

export interface IReceiver {
  // acteur de la conversation
  actor: IChatActor;
  // date de lecture du message
  read_date?: ILocalDate;
}

export interface IChatEvent {
  // evenement automatique
  type: ChatAutomaticEvent;
  // text auto du message
  text_auto?: IChatTextAuto;
  // date de l'émission de l'évenement
  event_date: ILocalDate;
}

export interface IMessageChunk {
  word: string;
  contact?: IInfoContact;
}

export interface ILinkInfos {
  title: IChatTextAuto;
  rto_no?: string;
}

export interface IPhoneNotification {
  title: IChatTextAuto;
  subtitle: IChatTextAuto;
  detail: string;
  appointmentsDetails: IChatTextAuto[];
  rtoNo: string;
  created_date: Date;
}
