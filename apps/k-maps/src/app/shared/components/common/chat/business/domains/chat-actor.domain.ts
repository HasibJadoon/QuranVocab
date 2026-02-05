export enum ChatActorType {
  chat_user = 'chat_user',
  chat_entity = 'chat_entity'
}
export const CHAT_ACTOR_TYPES = Object.values(ChatActorType);

export enum ChatActorFrom {
  MOVEECAR_DRIVER = 'MOVEECAR_DRIVER',
  MOVEECAR_CARRIER = 'MOVEECAR_CARRIER'
}
export const CHAT_ACTOR_FROM = Object.values(ChatActorFrom);
