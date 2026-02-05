import { ContextType } from '../domains/context-type.domain';

export interface AppContext {
  _id: string;
  name: string;
  type?: ContextType;
}
