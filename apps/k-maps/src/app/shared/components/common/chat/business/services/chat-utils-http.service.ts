import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitCoreEnv } from '@lib-shared/common/helpers/provider.helper';
import { map, tap } from 'rxjs/operators';
import { User } from '@lib-shared/common/auth/models/user.model';
import { IResource } from '@lib-shared/common/models/resource.model';
import { IResourceAssociation, IResourceAssociationSearchFilter } from '@lib-shared/common/models/resources-association.model';
import * as lodash from 'lodash';
import { ChatActorFrom } from '@lib-shared/common/chat/business/domains/chat-actor.domain';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';

export const PER_PAGE = 5;

@TraceErrorClass()
@Injectable({
  providedIn: 'root'
})
export class McitChatUtilsHttpService {
  constructor(private httpClient: HttpClient, private env: McitCoreEnv) {}

  autocompleteFromUsernames(query = '', usernames: string[], page?: number, per_page?: number, filters?: any, sort?: string, fields?: string): Observable<User[]> {
    return this.httpClient
      .post<User[]>(
        `${this.env.apiUrl}/v2/common/private/chat/utils/users?q=${query}&page=${page ?? 1}&per_page=${per_page ?? PER_PAGE}&sort=${sort ?? 'firstname'}&fields=${
          fields ?? 'firstname,lastname,phone,email,username'
        }&direct_autocomplete=true`,
        usernames,
        {
          params: filters ?? {},
          observe: 'response'
        }
      )
      .pipe(map((res) => res.body));
  }

  getUserFromUsername(username: string): Observable<User> {
    return this.httpClient.get(`${this.env.apiUrl}/v2/common/private/chat/utils/users/${username}`).pipe(map((res: User) => ({ ...res, apps: res.apps || {} } as User)));
  }

  getResource(id: string, carrierId: string): Observable<IResource> {
    return this.httpClient.get<IResource>(`${this.env.apiUrl}/v2/common/private/chat/utils/resources/${id}?carrier_id=${carrierId}`);
  }

  findResourceByUsername(from: ChatActorFrom | string): Observable<IResource> {
    return this.httpClient.get<IResource[]>(`${this.env.apiUrl}/v2/common/private/chat/utils/resources/username?from=${from}`).pipe(
      map((resources) => resources?.filter((re) => !re.disabled)),
      map((resources) => lodash.head(resources))
    );
  }

  searchResourceAssociation(filters: IResourceAssociationSearchFilter): Observable<IResourceAssociation[]> {
    return this.httpClient.get<IResourceAssociation[]>(`${this.env.apiUrl}/v2/common/private/chat/utils/resources/association`, {
      params: { ...filters }
    });
  }
}
