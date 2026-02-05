import { BehaviorSubject, fromEvent, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Upload } from '../upload/models/upload';

@Injectable()
export class LocalUploadService {
  public upload(file: File): Observable<Upload> {
    const sub: BehaviorSubject<Upload> = new BehaviorSubject<Upload>({
      progress: 0,
      done: false,
      error: false,
      name: file?.name
    });
    const fileReader = new FileReader();
    fromEvent(fileReader, 'progress').subscribe((event: ProgressEvent<FileReader>) => {
      sub.next({
        progress: Math.round((100 * event.loaded) / event.total),
        done: false,
        error: false,
        name: file?.name
      });
    });
    fromEvent(fileReader, 'load').subscribe((event: ProgressEvent<FileReader>) => {
      sub.next({
        progress: 100,
        done: true,
        error: false,
        name: file?.name,
        response: new HttpResponse<any>({ body: event.target.result })
      });
      sub.complete();
    });
    fromEvent(fileReader, 'error').subscribe((event: ProgressEvent<FileReader>) => {
      sub.next({
        progress: Math.round((100 * event.loaded) / event.total),
        done: false,
        error: true,
        name: file?.name
      });
      sub.complete();
    });
    fromEvent(fileReader, 'abort').subscribe((event: ProgressEvent<FileReader>) => {
      sub.next({
        progress: Math.round((100 * event.loaded) / event.total),
        done: false,
        error: true,
        name: file?.name
      });
      sub.complete();
    });
    fileReader.readAsArrayBuffer(file);
    return sub.asObservable();
  }
}
