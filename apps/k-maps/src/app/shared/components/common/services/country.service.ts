import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { COUNTRIES, Country } from '../models/country';
import { catchError, map, tap } from 'rxjs/operators';
import { McitCoreEnv } from '../helpers/provider.helper';
import { Observable, ReplaySubject, Subject, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class McitCountryService {
  private countrySubject: Subject<Country> = null;

  constructor(private httpClient: HttpClient, private env: McitCoreEnv) {}

  static getCountryPhone(code: string): Country {
    for (const c of COUNTRIES) {
      if (c.code === code) {
        return c;
      }
    }
    return null;
  }

  getIPCountry(): Observable<Country> {
    if (this.countrySubject) {
      return this.countrySubject.asObservable();
    }
    this.countrySubject = new ReplaySubject(1);
    return this.httpClient.get(`${this.env.apiUrl}/v1/public/whereiam`).pipe(
      map((v) => McitCountryService.getCountryPhone(v['country_code'])),
      tap((c) => this.countrySubject.next(c)),
      catchError((err) => {
        this.countrySubject.error(err);
        this.countrySubject = null;
        return throwError(err);
      })
    );
  }
}
