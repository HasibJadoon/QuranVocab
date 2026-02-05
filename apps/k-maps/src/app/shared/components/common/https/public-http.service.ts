import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { McitCoreConfig, McitCoreEnv } from '../helpers/provider.helper';
import { UserSignup } from '../models/user-signup';

@Injectable({
  providedIn: 'root'
})
export class PublicHttpService {
  constructor(private httpClient: HttpClient, private env: McitCoreEnv, private config: McitCoreConfig) {}

  validEmail(email: string): Observable<any> {
    return this.httpClient.get(`${this.env.apiUrl}/v2/common/public/account/validemail?email=${email.replace('+', '%2B')}`);
  }

  askChangePassword(email: any): any {
    return this.httpClient.post(`${this.env.apiUrl}/v2/common/public/account/password/reset/${this.config.app}`, {
      email: email.email
    });
  }

  changePasswordWithToken(resetInfo: { email: string; code: string; password: string }): any {
    return this.httpClient.put(`${this.env.apiUrl}/v2/common/public/account/password/reset/`, resetInfo);
  }

  signup(userSignup: UserSignup): Observable<HttpResponse<any>> {
    return this.httpClient.post(`${this.env.apiUrl}/v2/common/public/account/signup/${this.config.app}`, userSignup, {
      observe: 'response'
    });
  }
}
