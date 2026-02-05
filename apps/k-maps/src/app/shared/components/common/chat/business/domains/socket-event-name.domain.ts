import { ChatActorFrom } from '@lib-shared/common/chat/business/domains/chat-actor.domain';
import { IChatMessage, IChatTextAuto } from '@lib-shared/common/chat/business/model/chat-message.model';

export enum SocketEventNames {
  NEW_MESSAGE_SENT = 'NEW_MESSAGE_SENT',
  NEW_MESSAGE_RECEIVED = 'NEW_MESSAGE_RECEIVED',
  IS_TYPING = 'IS_TYPING',
  HAS_ROLE_CHANGE = 'HAS_ROLE_CHANGE'
}

export type ISocketNewMessageSent = IChatMessage;

export interface ISocketIsTypingData {
  discussionId: string;
  from: string;
  user: {
    lastname: string;
    firstname: string;
    email: string;
  };
}

export interface ISocketChatRightChange {
  user_id: string;
}

export interface ISocketNewMessageReceive {
  discussionId: string;
  ids: string[];
  from: ChatActorFrom;
}
