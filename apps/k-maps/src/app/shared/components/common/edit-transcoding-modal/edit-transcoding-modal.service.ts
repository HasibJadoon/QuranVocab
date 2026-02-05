import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../dialog/dialog.service';
import { ITranscoding } from '../models/transcoding.model';
import { McitEditTranscodingModalComponent } from './edit-transcoding-modal.component';
import { HttpResponse } from '@angular/common/http';

@Injectable()
export class McitEditTranscodingModalService {
  constructor(private dialog: McitDialog) {}

open(
  transcoding: ITranscoding[],
  readOnly: boolean,
  autocomplete?: (s) => Observable<HttpResponse<any[]>>,
  showOutgoingTranscoding: boolean = false,
  showExternalName: boolean = false
): Observable<any> {
    const ref = this.dialog.open<McitEditTranscodingModalComponent, any, any>(McitEditTranscodingModalComponent, {
      dialogClass: 'modal-lg',
      data: {
        transcoding,
        readOnly,
        autocomplete,
        showOutgoingTranscoding,
        showExternalName
      }
    });
    return ref.afterClosed();
  }
}
