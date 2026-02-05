import { Observable } from 'rxjs';
import { IResource } from '@lib-shared/common/models/resource.model';

export interface GenericChatResourceHttpService {
  findResourceByUsername(username?: string, carrierId?: string): Observable<IResource[]>;

  update(id: string, resource: IResource): Observable<IResource>;

  get(id: string): Observable<IResource>;
}
