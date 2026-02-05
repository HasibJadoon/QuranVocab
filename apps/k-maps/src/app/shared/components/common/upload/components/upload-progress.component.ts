import { Component, ViewChild, Renderer2, ElementRef, Input, AfterViewInit, OnDestroy, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Upload, UploadError } from '../models/upload';

@Component({
  selector: 'mcit-upload-progress',
  templateUrl: './upload-progress.component.html',
  styleUrls: ['./upload-progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadProgressComponent implements AfterViewInit, OnDestroy {
  @ViewChild('progress', { static: true }) private progress: ElementRef;
  @Input() upload$: Observable<Upload>;
  @Input() autoCleanTimeoutSec = -1;

  @Output() uploadEnded: EventEmitter<Upload> = new EventEmitter();
  @Output() uploadError: EventEmitter<UploadError> = new EventEmitter();
  @Output() resetUpload: EventEmitter<Upload> = new EventEmitter();

  private sub: Subscription;
  error: boolean;

  constructor(private rend: Renderer2, private cd: ChangeDetectorRef) {}

  ngAfterViewInit() {
    this.error = false;
    this.sub = this.upload$.subscribe((upload) => {
      if (upload.progress <= 100) {
        this.rend.addClass(this.progress.nativeElement, 'bg-primary');
        this.rend.setStyle(this.progress.nativeElement, 'width', upload.progress + '%');
        this.rend.setAttribute(this.progress.nativeElement, 'aria-valuenow', String(upload.progress));
      }

      if (upload.done) {
        this.uploadEnded.emit(upload);
        this.rend.removeClass(this.progress.nativeElement, 'bg-primary');
        this.rend.addClass(this.progress.nativeElement, 'bg-success');
        this.cd.detectChanges();
      }

      if (upload.error) {
        this.rend.removeClass(this.progress.nativeElement, 'bg-primary');
        this.rend.addClass(this.progress.nativeElement, 'bg-danger');
        this.rend.setStyle(this.progress.nativeElement, 'width', '100%');
        this.rend.setAttribute(this.progress.nativeElement, 'aria-valuenow', '100');
        this.error = true;
        this.uploadError.emit(new UploadError(upload, upload.response.statusText));
      }
      this.cd.detectChanges();
    });
  }

  reset(upload: Upload) {
    this.resetUpload.emit(upload);
  }

  ngOnDestroy(): void {
    try {
      this.sub.unsubscribe();
    } catch (e) {}
  }
}
