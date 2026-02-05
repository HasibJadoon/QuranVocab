import { Component, Input, OnInit } from '@angular/core';
import { IDocumentLink } from '../models/types.model';
import { environment } from '../../../../../dispatcher/src/environments/environment';
import { McitImageViewerOverlayService } from '../image-viewer-overlay/image-viewer-overlay.service';
import * as lodash from 'lodash';
import { saveAs } from 'file-saver';
import { McitPopupService } from '../services/popup.service';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { McitWaitingService } from '../services/waiting.service';

interface IDocumentContainer {
  previewUrl?: string;
  url: string;
  loaded?: boolean;
  viewerIndex?: number;
  viewable: boolean;
  name: string;
}

@Component({
  selector: 'mcit-documents-viewer',
  templateUrl: './documents-viewer.component.html',
  styleUrls: ['./documents-viewer.component.scss']
})
export class McitDocumentsViewerComponent implements OnInit {
  @Input()
  set documents(documents: IDocumentLink[] | IDocumentLink) {
    let count = 0;
    this.documentContainers =
      lodash.compact(lodash.isArray(documents) ? documents : [documents])?.map((d) => ({
        previewUrl: `${environment.apiUrl}/v2/common/private/documents/${d.document_id}?preview=true`,
        url: `${environment.apiUrl}/v2/common/private/documents/${d.document_id}`,
        loaded: false,
        viewable: this.isImageFile(d.name),
        viewerIndex: this.isImageFile(d.name) ? count++ : -1,
        name: d.name,
        meta_data: d.meta_data
      })) ?? [];
  }

  @Input()
  cellWidth = 100;
  @Input()
  cellHeight = 100;
  @Input()
  direction: 'horizontal' | 'vertical' = 'horizontal';
  @Input()
  viewable = true;

  documentContainers: IDocumentContainer[];

  constructor(private imageViewerModalService: McitImageViewerOverlayService, private popupService: McitPopupService, private httpClient: HttpClient, private waitingService: McitWaitingService) {}

  ngOnInit(): void {}

  trackByDoc(index: number, item: IDocumentContainer): string {
    return item.url;
  }

  onLoad(index: number): void {
    this.documentContainers[index].loaded = true;
  }

  doShow(documentContainer: IDocumentContainer, index: number): void {
    if (documentContainer.viewable) {
      this.imageViewerModalService.open({
        urls: this.documentContainers.filter((d) => d.viewable).map((d) => d.url),
        current: documentContainer.viewerIndex
      });
    } else {
      this.waitingService.showWaiting();
      this.httpClient
        .get(documentContainer.url, {
          responseType: 'arraybuffer',
          observe: 'body'
        })
        .pipe(
          tap((res) => {
            this.waitingService.hideWaiting();
            const chars = documentContainer.name.split('.');
            saveAs(new Blob([res], { type: chars[chars.length - 1] }), documentContainer.name);
          }),
          catchError(() => {
            this.waitingService.hideWaiting();
            this.popupService.showError();
            return EMPTY;
          })
        )
        .subscribe();
    }
  }

  private isImageFile(name: string): boolean {
    if (name == null || name.indexOf('.') === -1) {
      return true;
    }
    const jpeg = name.toString().toLowerCase().endsWith('jpeg');
    const jpg = name.toString().toLowerCase().endsWith('jpg');
    const png = name.toString().toLowerCase().endsWith('png');

    return jpeg === true || jpg === true || png === true;
  }
}
