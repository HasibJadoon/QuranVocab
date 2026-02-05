import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';
import { McitCoreEnv } from '@lib-shared/common/helpers/provider.helper';

@TraceErrorClass()
@Injectable()
export class McitAttachmentsHttpService {
  constructor(private httpClient: HttpClient, private environment: McitCoreEnv) {}

  getTmpDocument(documentId: string, isPreview: boolean): Observable<{ buff: ArrayBuffer; url: string }> {
    const url = `${this.environment.apiUrl}/v2/common/private/tmp-documents/${documentId}`;
    return this.httpClient
      .get(`${url}${isPreview ? '?preview=true' : ''}`, {
        responseType: 'arraybuffer',
        observe: 'body'
      })
      .pipe(map((res) => ({ buff: res, url })));
  }

  addTmpDocument(formData: FormData, baseUrl: string, suffixUrl?: string) {
    return this.httpClient.post((baseUrl ?? `${this.environment.apiUrl}/v2/common/private/tmp-documents`) + (suffixUrl ?? ''), formData);
  }

  deleteTmpDocument(documentId: string, baseUrl: string, suffixUrl?: string) {
    return this.httpClient.delete((baseUrl ?? `${this.environment.apiUrl}/v2/common/private/tmp-documents)`) + `/${documentId}` + (suffixUrl ?? ''));
  }
}
