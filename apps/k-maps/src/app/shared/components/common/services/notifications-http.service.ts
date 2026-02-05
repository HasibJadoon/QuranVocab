import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitCoreEnv } from '../helpers/provider.helper';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { IMeaning, ITracable } from '../models/types.model';

export interface INotificationMessage extends ITracable {
  _id: string;
  // De
  from: string;
  // Nom du de
  from_name: string;
  // Pour
  to: string;
  // Nom du pour
  to_name: string;
  // Titre
  objects: IMeaning;
  // Corps du message
  bodies: IMeaning;
  // Lu
  read?: boolean;
  // Date de lecture
  readed_date?: Date;
  // Sévérité
  severity: string;
  // Applications
  applications?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class McitNotificationsHttpService {
  constructor(private env: McitCoreEnv, private httpClient: HttpClient) {}

  search(query: string, filters: { read?: string; application?: string }, page: number, per_page: number, sort: string, fields: string): Observable<HttpResponse<INotificationMessage[]>> {
    return this.httpClient.get<INotificationMessage[]>(`${this.env.apiUrl}/v2/common/private/notifications/?q=${query}&page=${page}&per_page=${per_page}&sort=${sort}&fields=${fields}`, {
      params: { ...filters },
      observe: 'response'
    });
  }

  get(id: string): Observable<INotificationMessage> {
    return this.httpClient.get<INotificationMessage>(`${this.env.apiUrl}/v2/common/private/notifications/${id}`);
  }

  read(id: string): Observable<INotificationMessage> {
    return this.httpClient.put<INotificationMessage>(`${this.env.apiUrl}/v2/common/private/notifications/${id}/read`, null);
  }

  delete(id: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.env.apiUrl}/v2/common/private/notifications/${id}`);
  }
}
