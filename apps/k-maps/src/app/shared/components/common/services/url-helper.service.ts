import { Injectable } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import * as FileSaver from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class McitUrlHelperService {
  constructor(private httpClient: HttpClient) {}

  get(url: string): Observable<string> {
    return new Observable((observer: Subscriber<string>) => {
      let objectUrl: string = null;

      this.httpClient
        .get(url, {
          responseType: 'arraybuffer',
          observe: 'response'
        })
        .subscribe(
          (res) => {
            const blob = new Blob([res.body], { type: 'image/jpg' });
            objectUrl = URL.createObjectURL(blob);
            observer.next(objectUrl);
          },
          (error) => {
            const blob = new Blob([error.body], { type: 'image/jpg' });
            objectUrl = URL.createObjectURL(blob);
            observer.next(objectUrl);
          }
        );

      return () => {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
          objectUrl = null;
        }
      };
    });
  }

  download(response: ArrayBuffer | Blob | string, type: string, name: string): void {
    const blob = new Blob([response], { type });

    FileSaver.saveAs(blob, name);
  }
}
