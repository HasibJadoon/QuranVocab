import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IDocumentLink } from '@lib-shared/common/models/types.model';
import { Observable } from 'rxjs';
import { McitCoreConfig, McitCoreEnv } from '../helpers/provider.helper';
import { IExpense } from '../models/expense.model';

@Injectable({
  providedIn: 'root'
})
export class ExpenseHttpService {
  constructor(private httpClient: HttpClient, private environment: McitCoreEnv, private config: McitCoreConfig) {}

  search(q: string, page: number, per_page: number, fields: string, sort: string, filters: any): Observable<HttpResponse<IExpense[]>> {
    return this.httpClient.get<any[]>(`${this.environment.apiUrl}/v2/${this.config.app}/expenses?q=${q ? q : ''}&fields=${fields}&page=${page}&per_page=${per_page}&sort=${sort}`, {
      observe: 'response',
      params: { ...filters }
    });
  }

  excel(q: string, sort: string, filters: any): Observable<Blob> {
    return this.httpClient.get(`${this.environment.apiUrl}/v2/${this.config.app}/expenses/excel?q=${q ? q : ''}&sort=${sort}`, {
      params: { ...filters },
      responseType: 'blob'
    });
  }

  addExpense(expense: Omit<IExpense, '_id' | 'status' | 'expense_no'>): Observable<IExpense> {
    return this.httpClient.post<IExpense>(`${this.environment.apiUrl}/v2/${this.config.app}/expenses`, expense);
  }

  updateExpense(expense: IExpense): Observable<IExpense> {
    return this.httpClient.put<IExpense>(`${this.environment.apiUrl}/v2/${this.config.app}/expenses/${expense._id}`, expense);
  }

  getExpenseById(expenseId: string): Observable<IExpense> {
    return this.httpClient.get<IExpense>(`${this.environment.apiUrl}/v2/${this.config.app}/expenses/${expenseId}`);
  }

  searchExpensesByIds(ids: string[]): Observable<IExpense[]> {
    return this.httpClient.get<IExpense[]>(`${this.environment.apiUrl}/v2/${this.config.app}/expenses/?ids=${ids}`);
  }

  deleteExpense(expenseId: string): Observable<IExpense> {
    return this.httpClient.delete<IExpense>(`${this.environment.apiUrl}/v2/${this.config.app}/expenses/${expenseId}`);
  }

  addExpenseAttachment(expenseId: string, formData: FormData): Observable<IDocumentLink> {
    return this.httpClient.post(`${this.environment.apiUrl}/v2/${this.config.app}/expenses/attachments`, formData);
  }

  getExpenseAttachment(expenseId: string, documentId: string) {
    return this.httpClient.get(`${this.environment.apiUrl}/v2/${this.config.app}/expenses/attachments/${documentId}`, {
      responseType: 'arraybuffer',
      observe: 'body'
    });
  }

  deleteExpenseAttachment(documentId: string): Observable<string> {
    return this.httpClient.delete<string>(`${this.environment.apiUrl}/v2/${this.config.app}/expenses/attachments/${documentId}`);
  }
}
