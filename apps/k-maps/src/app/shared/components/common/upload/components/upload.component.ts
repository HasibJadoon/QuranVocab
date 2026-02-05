import { Component, Input, Output, EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Observable, timer, of } from 'rxjs';

import { Upload, UploadError } from '../models/upload';
import { tap, delay } from 'rxjs/operators';

@Component({
  selector: 'mcit-movee-upload',
  templateUrl: './upload.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        height: 100%;
        display: block;
      }

      .hover {
        background: rgba(0, 68, 147, 0.1);
        border: 1px solid rgba(0, 0, 0, 0.13);
      }

      .normal {
        background: rgba(0, 68, 147, 0.05);
        border: 1px solid rgba(0, 0, 0, 0.13);
      }

      .hidden {
        transform: scale(0);
        min-height: 0;
        max-height: 0;
        overflow: hidden;
      }
    `
  ]
})
export class UploadComponent {
  uploads: Array<Observable<Upload>> = [];

  @Input() endpoint: string;
  @Input() fileExtensions: string[];
  @Input() fontAwesomeIcon = 'fa-upload';
  @Input() maxMegabytes = 10;
  @Input() localizedDescription = 'UPLOADS.DEFAULT';
  @Input() allowPipeToService = false;
  @Input() uploadResponseType: 'arraybuffer' | 'blob' | 'json' | 'text';
  @Input() directory = false;
  @Input() multiple = false;
  @Input() autoCleanTimeoutSec = -1;
  @Input() autoCleanErrorTimeoutSec = -1;
  @Input() parallelism = 1;

  @Output() uploadStarted: EventEmitter<Observable<Upload>> = new EventEmitter();
  @Output() uploadEnded: EventEmitter<Upload> = new EventEmitter();
  @Output() uploadError: EventEmitter<UploadError> = new EventEmitter();
  @Output() uploadReset: EventEmitter<Upload> = new EventEmitter();

  constructor(private cd: ChangeDetectorRef) {}

  onUploadStarted(upload$: Observable<Upload>) {
    this.uploadStarted.emit(upload$);
    this.uploads = [...this.uploads, upload$];
    this.cd.detectChanges();
  }

  afterUpload(upload: Upload, upload$: Observable<Upload>) {
    this.uploadEnded.emit(upload);
    if (this.autoCleanTimeoutSec > 0) {
      of({ upload, upload$ })
        .pipe(
          delay(this.autoCleanTimeoutSec * 1000),
          tap(() => this.reset(upload, upload$))
        )
        .subscribe();
    }
  }

  onUploadError(error: UploadError, upload$: Observable<Upload>) {
    this.uploadError.emit(error);
    if (this.autoCleanErrorTimeoutSec > 0) {
      of({ error, upload$ })
        .pipe(
          delay(this.autoCleanErrorTimeoutSec * 1000),
          tap(() => this.reset(error.upload, upload$))
        )
        .subscribe();
    }
    this.cd.detectChanges();
  }

  reset(upload: Upload, upload$: Observable<Upload>): void {
    if (this.uploads.includes(upload$)) {
      this.uploads = this.uploads.filter((ul) => ul !== upload$);
      this.uploadReset.emit(upload);
      this.cd.detectChanges();
    }
  }
}
