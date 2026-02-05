import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpEvent, HttpEventType, HttpResponse, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

import { Upload } from '../models/upload';

export interface IUploadOptions {
  allowPipeToService: boolean;
  responseType?: 'arraybuffer' | 'blob' | 'json' | 'text';
}

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  constructor(private http: HttpClient) {}

  public upload(endpoint: string, file: File, options?: IUploadOptions): Observable<Upload> {
    const payload = new FormData();
    payload.append('file', file, file.name);
    const httpOptions = {
      reportProgress: true
    };
    if (options?.allowPipeToService) {
      httpOptions['headers'] = new HttpHeaders({
        'use-skipper': 'disabled'
      });
    }
    if (options?.responseType) {
      httpOptions['responseType'] = options?.responseType;
      if (options?.responseType === 'arraybuffer') {
        httpOptions['observe'] = 'response';
      }
    }
    const sub: BehaviorSubject<Upload> = new BehaviorSubject<Upload>({
      progress: 0,
      done: false,
      error: false,
      name: file.name
    });
    this.http.request(new HttpRequest('POST', endpoint, payload, httpOptions)).subscribe(
      (event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress) {
          sub.next({
            progress: Math.round((100 * event.loaded) / event.total),
            done: false,
            error: false,
            name: file.name
          });
        } else if (event instanceof HttpResponse) {
          sub.next({
            progress: 100,
            done: true,
            error: false,
            name: file.name,
            response: event
          });
          sub.complete();
        } else if (event instanceof HttpErrorResponse) {
          sub.next({
            progress: 0,
            done: false,
            error: event,
            name: file.name
          });
          sub.complete();
        }
      },
      (error) => {
        sub.next({
          progress: 100,
          done: false,
          error,
          name: file.name,
          response: error
        });
        sub.complete();
      }
    );
    return sub.asObservable();
  }
}
