import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { expand, map, reduce } from 'rxjs/operators';
import { McitCoreConfig, McitCoreEnv } from '@lib-shared/common/helpers/provider.helper';
import { IServiceRef, IVehicleCheckQuestion } from '../../../common/inspection/inspection.model';
import { DispatcherApiRoutesEnum } from '../dispatcher-api-routes.domain';

@Injectable({
  providedIn: 'root'
})
export class InspectionsHttpService {
  constructor(private http: HttpClient, private config: McitCoreConfig, private env: McitCoreEnv) {}

  /**
   * CHECKS QUESTIONS
   */

  getAllChecksQuestions(q: string, thirdPartyId?: string, apiRoute?: DispatcherApiRoutesEnum): Observable<IVehicleCheckQuestion[]> {
    return this.getChecksQuestionsPage(q, 1, thirdPartyId, apiRoute).pipe(
      expand((data) => (data.next ? this.getChecksQuestionsPage(q, data.next, thirdPartyId, apiRoute) : EMPTY)),
      map((data) => data.results),
      reduce((acc, data) => acc.concat(data), [])
    );
  }

  private getChecksQuestionsPage(q: string, page: number, thirdPartyId?: string, apiRoute?: DispatcherApiRoutesEnum): Observable<{ next: number; results: IVehicleCheckQuestion[] }> {
    return this.searchChecksQuestionsReferential(q, thirdPartyId, apiRoute, page, 100).pipe(
      map((resp) => {
        const totalPages = Number(resp.headers.get('X-TOTAL-PAGES'));
        return {
          next: page < totalPages ? page + 1 : 0,
          results: resp.body
        };
      })
    );
  }

  private searchChecksQuestionsReferential(q: string, thirdPartyId?: string, apiRoute?: DispatcherApiRoutesEnum, page?: number, per_page?: number): Observable<HttpResponse<IVehicleCheckQuestion[]>> {
    if (apiRoute) {
      return this.http.get<IVehicleCheckQuestion[]>(`${this.env.apiUrl}/v2/${this.config.app}/${apiRoute}/inspections/questions/checks?q=${q}&sort=group_name&page=${page || 1}&per_page=${per_page || 10}`, {
        observe: 'response'
      });
    } else {
      return this.http.get<IVehicleCheckQuestion[]>(`${this.env.apiUrl}/v2/${this.config.app}/inspections/questions/checks?q=${q}&sort=group_name&page=${page || 1}&per_page=${per_page || 10}&third_party_id=${thirdPartyId}`, {
        observe: 'response'
      });
    }
  }

  searchServices(q: string, page: number, per_page: number, sort: string, thirdPartyId: string): Observable<IServiceRef[]> {
    return this.http.get<IServiceRef[]>(`${this.env.apiUrl}/v2/admin/referentials/vehicles/services?q=${q}&sort=${sort}&page=${page}&per_page=${per_page}&thirdPartyId=${thirdPartyId}`);
  }

  saveQuestionsSort(contractId: string, groupedChecks: any): Observable<any> {
    const sortedChecks = [];
    groupedChecks.forEach((group, idx) => {
      const questions = [];
      group.value.forEach((check, idx) => {
        questions.push({
          _id: check._id,
          sort: idx
        });
      });
      sortedChecks.push({
        key: group.key,
        questions,
        sort: idx
      });
    });
    const payload = {
      contractId: contractId,
      groups: sortedChecks
    };
    return this.http.post(`${this.env.apiUrl}/v2/dispatcher/carrier/questions-sort`, payload, {
      responseType: 'json'
    });
  }

  getSortOfQuestions(contractId: string): Observable<any> {
    return this.http.get(`${this.env.apiUrl}/v2/dispatcher/carrier/questions-sort/${contractId}`, {
      responseType: 'json'
    });
  }
}
