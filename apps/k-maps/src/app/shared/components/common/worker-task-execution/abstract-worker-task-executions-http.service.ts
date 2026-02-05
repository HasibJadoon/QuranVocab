import { HttpClient, HttpResponse } from '@angular/common/http';
import { EMPTY, Observable } from 'rxjs';
import * as lodash from 'lodash';
import { expand, map, reduce } from 'rxjs/operators';
import { IWorkerTaskExecution } from '@lib-shared/common/worker-task-execution/worker-task-execution.model';

export interface WorkerTaskExecutionsSearchFilters {
  tag_kind?: string;
  tag_value?: string;
  status?: string;
  execution_id?: string;
  action?: string;
  hide_concurrency_worker?: boolean;
  only_me?: boolean;
}

export interface WorkerTaskExecutionsResumeFilters {
  tag_kind?: string;
  tag_value?: string;
  status?: string;
  only_me?: boolean;
}

export interface IWorkerTaskExecutionResume {
  execution_id: string;
  action: string;
  action_description: string;
  nbErrors: number;
  nbOthers: number;
  current: number;
  total: number;
  action_by: string;
  action_date: Date;
}

export abstract class AbstractWorkerTaskExecutionsHttpService {
  constructor(protected url: string, protected httpClient: HttpClient) {}

  search(query: string, page: number, per_page: number, filters: WorkerTaskExecutionsSearchFilters, sort: string, fields: string): Observable<HttpResponse<IWorkerTaskExecution[]>> {
    return this.httpClient.get<IWorkerTaskExecution[]>(`${this.url}/?q=${query}&page=${page}&per_page=${per_page}&sort=${sort}&fields=${fields}`, {
      params: lodash.omitBy(filters, lodash.isNil),
      observe: 'response'
    });
  }

  getAll(query: string, filters: WorkerTaskExecutionsSearchFilters, sort: string, fields: string): Observable<IWorkerTaskExecution[]> {
    return this.getPage(1, query, filters, sort, fields).pipe(
      expand((data, i) => (data.next ? this.getPage(data.next, query, filters, sort, fields) : EMPTY)),
      map((data) => data.results),
      reduce((acc, data) => acc.concat(data), [])
    );
  }

  private getPage(page: number, query: string, filters: WorkerTaskExecutionsSearchFilters, sort: string, fields: string): Observable<{ next: number; results: IWorkerTaskExecution[] }> {
    return this.search(query, page, 100, filters, sort, fields).pipe(
      map((resp) => {
        const totalPages = Number(resp.headers.get('X-TOTAL-PAGES'));
        return {
          next: page < totalPages ? page + 1 : 0,
          results: resp.body
        };
      })
    );
  }

  getResumes(filters: WorkerTaskExecutionsResumeFilters): Observable<IWorkerTaskExecutionResume[]> {
    return this.httpClient.get<IWorkerTaskExecutionResume[]>(`${this.url}/resumes`, {
      params: lodash.omitBy(filters, lodash.isNil)
    });
  }

  recycle(id: string): Observable<void> {
    return this.httpClient.put<void>(`${this.url}/${id}/recycle`, {});
  }

  delete(id: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.url}/${id}`, {});
  }
}
