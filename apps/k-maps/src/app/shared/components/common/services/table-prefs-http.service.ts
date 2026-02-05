import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitCoreEnv } from '../helpers/provider.helper';

export interface IFavoriteTablePref {
  name: string;
  value: {
    text_size?: 'small' | 'normal' | 'large';
    show_line_number?: boolean;
    columns?: {
      [key: string]: {
        width?: number;
        visible?: boolean;
        position?: number;
      };
    };
  };
  created_date: Date;
}

export interface ITablePref {
  favorites?: IFavoriteTablePref[];
}

@Injectable({
  providedIn: 'root'
})
export class McitTablePrefsHttpService {
  constructor(private env: McitCoreEnv, private httpClient: HttpClient) {}

  save(key: string, saveTable: ITablePref): Observable<HttpResponse<any>> {
    return this.httpClient.put(`${this.env.apiUrl}/v2/common/private/table-prefs/${key}`, saveTable, {
      observe: 'response'
    });
  }

  get(key: string, fields: string): Observable<ITablePref> {
    return this.httpClient.get<ITablePref>(`${this.env.apiUrl}/v2/common/private/table-prefs/${key}?fields=${fields}`);
  }
}
