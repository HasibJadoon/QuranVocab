import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { McitCoreEnv } from '../helpers/provider.helper';

@Injectable({
  providedIn: 'root'
})
export class CommonHttpService {
  constructor(private httpClient: HttpClient, private env: McitCoreEnv) {}

  changePasswordWithOldPassword(oldPassword: string, newPassword: string): Observable<any> {
    return this.httpClient.patch(
      `${this.env.apiUrl}/v2/common/private/account/password/update`,
      {
        oldpassword: oldPassword,
        newpassword: newPassword
      },
      {
        responseType: 'text'
      }
    );
  }

  avatar(): Observable<HttpResponse<ArrayBuffer>> {
    return this.httpClient.get(`${this.env.apiUrl}/v2/common/private/account/avatar`, {
      responseType: 'arraybuffer',
      observe: 'response'
    });
  }
}
