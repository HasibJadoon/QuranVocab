import { Component, HostListener, HostBinding, Input, Output, EventEmitter, ViewChild, ElementRef, Renderer2, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Observable, from, bindCallback, EMPTY } from 'rxjs';
import * as _ from 'lodash';

import { UploadService } from '../services/upload.service';
import { Upload } from '../models/upload';
import { McitPopupService } from '../../services/popup.service';
import { expand, concatMap, toArray, filter, map, mergeMap } from 'rxjs/operators';

const enum backgroundColors {
  normal = 'd-flex flex-fill flex-column normal',
  hover = 'd d-flex flex-fill flex-column hover'
}

@Component({
  selector: 'mcit-upload-zone',
  template: `
    <div #customContent class="upload-zone click" style="height: inherit;" [style.display]="defaultContent ? 'none' : 'flex'">
      <ng-content></ng-content>
    </div>
    <ng-container *ngIf="defaultContent === true">
      <i class="fas fa-3x" [ngClass]="fontAwesomeIcon"></i>
      <div class="click">
        <h3 style="margin-top:15px;white-space: pre-line; text-align: center;">
          {{ localizedDescription | translate }}
        </h3>
      </div>
    </ng-container>
    <input hidden [attr.webkitdirectory]="directory ? '' : null" [attr.directory]="directory ? '' : null" [attr.multiple]="multiple ? '' : null" type="file" #uploader (change)="fromInput($event)" />
  `,
  styleUrls: ['./upload-zone.component.scss']
})
export class UploadZoneComponent implements AfterViewInit {
  @Input() fontAwesomeIcon: string;
  @Input() maxMegabytes: number;
  @Input() localizedDescription: string;
  @Input() directory = false;
  @Input() multiple = false;
  @Output() fileUpload: EventEmitter<Observable<Upload>> = new EventEmitter();
  @Input() parallelism = 1;

  @Input() private allowPipeToService: boolean;
  @Input() private responseType: 'arraybuffer' | 'blob' | 'json' | 'text';
  @Input() private fileExtensions: string[] = [];
  @Input() private endpoint: string;
  private sapFileExtension = /\d{4}(0[0-9]|1[0-2])([0-2][0-9]|3[0-1])[_]([0-1][0-9]|2[0-4])(([0-5][0-9]){2})/;

  @HostBinding('class') class: backgroundColors = backgroundColors.normal;

  @ViewChild('uploader', { static: true }) private uploader: ElementRef;
  @ViewChild('customContent') customContent;
  @ViewChild('gnContent') gnContent;

  defaultContent: boolean;

  @HostListener('dragover', ['$event'])
  onDragOver(evt: DragEvent) {
    evt.stopPropagation();
    evt.preventDefault();
    this.class = backgroundColors.hover;
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(evt: DragEvent) {
    evt.stopPropagation();
    evt.preventDefault();
    this.class = backgroundColors.normal;
  }

  @HostListener('drop', ['$event'])
  onDrop(evt: DragEvent) {
    evt.stopPropagation();
    evt.preventDefault();

    this.class = backgroundColors.normal;

    const fileSystemEntries: Array<FileSystemEntry> = [];
    if (evt.dataTransfer.items.length > 0) {
      for (let i = 0; i < evt.dataTransfer.items.length; i++) {
        fileSystemEntries.push(evt.dataTransfer.items[i].webkitGetAsEntry());
      }
    }
    this.collectFilesAndStartUpload(fileSystemEntries);
  }

  @HostListener('click')
  onclick() {
    this.uploader.nativeElement.click();
  }

  constructor(private cdRef: ChangeDetectorRef, private uploadService: UploadService, private rend: Renderer2, private popupService: McitPopupService) {}

  public ngAfterViewInit(): void {
    this.defaultContent = !this.customContent.nativeElement?.children?.length;
    if (this.customContent.nativeElement?.children?.length) {
      this.rend.setStyle(this.customContent.nativeElement?.children[0], 'height', 'inherit');
    }
    this.cdRef.detectChanges();
  }

  public fromInput(event: any) {
    const files: Array<File> = [];
    if (event.target.files.length > 0) {
      for (const file of event.target.files) {
        files.push(file);
      }
    }
    this.uploader.nativeElement.value = '';
    this.startUpload(files);
  }

  private startUpload(files: Array<File>): void {
    from(this.multiple ? files : [_.head(files)])
      .pipe(
        map((file) =>
          this.fileExtensions?.length && !this.fileExtensions.includes(file.name.split('.').pop().toLowerCase()) && !this.fileExtensions.includes('*') && !this.sapFileExtension.test(file.name.split('.').pop().toLowerCase())
            ? { error: 'UPLOADS.ERRORS.FILETYPE', file }
            : file.size > this.maxMegabytes * Math.pow(10, 6)
            ? { error: 'UPLOADS.ERRORS.FILESIZE', file }
            : file
        ),
        filter((fileOrError) => {
          if ('error' in fileOrError) {
            this.popupService.show('warning', fileOrError.error, {
              messageParams: {
                fileName: fileOrError.file.name,
                fileSize: Math.round(fileOrError.file.size / Math.pow(10, 6)),
                size: this.maxMegabytes
              }
            });
            return false;
          }
          return true;
        }),
        // tap((file: File) => console.log(`file ${file.name} / ${file.size}`)),
        mergeMap((file: File) => {
          const upload$ = this.uploadService.upload(this.endpoint, file, {
            allowPipeToService: this.allowPipeToService,
            responseType: this.responseType
          });
          this.fileUpload.emit(upload$);
          return upload$;
        }, this.parallelism)
      )
      .subscribe();
  }

  private collectFilesAndStartUpload(fileSystemEntries: Array<FileSystemEntry>): void {
    from(fileSystemEntries)
      .pipe(
        expand((fse) => {
          if (fse.isDirectory && this.directory) {
            const reader = (fse as FileSystemDirectoryEntry).createReader();
            return bindCallback(reader.readEntries)
              .bind(reader)()
              .pipe(concatMap((entries: Array<FileSystemEntry>) => from(entries)));
          }
          return EMPTY;
        }),
        filter((fse: FileSystemEntry) => fse.isFile),
        concatMap((fse) => bindCallback((fse as FileSystemFileEntry).file).bind(fse)()),
        toArray()
      )
      .subscribe((files) => this.startUpload(files as Array<File>));
  }
}
