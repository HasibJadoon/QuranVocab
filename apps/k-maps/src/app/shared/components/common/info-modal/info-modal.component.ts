import { Component, Inject, OnInit } from '@angular/core';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'mcit-info-modal',
  templateUrl: './info-modal.component.html',
  styleUrls: ['./info-modal.component.scss']
})
export class McitInfoModalComponent implements OnInit {
  title: string;
  message: string;
  params: object;
  message2: string;
  message3: string;
  link: { url: string; content?: string };
  renderMessageAsHtml?: boolean;

  constructor(
    private dialogRef: McitDialogRef<McitInfoModalComponent, void>,
    private translateService: TranslateService,
    @Inject(MCIT_DIALOG_DATA)
    data: {
      title: string;
      message: string;
      messageParams?: object;
      extraLines?: { messageKey2?: string; messageKey3?: string; messageParams2?: object; messageParams3?: object };
      link?: { url: string; content?: string };
      options?: { renderMessageAsHtml?: boolean };
    }
  ) {
    this.title = data.title;
    this.message = data.message;
    this.params = data.messageParams;
    this.renderMessageAsHtml = data.options?.renderMessageAsHtml ?? false;
    if (data?.extraLines?.messageKey2) {
      this.message2 = this.translateService.instant(data.extraLines.messageKey2, data.extraLines?.messageParams2);
    }
    if (data?.extraLines?.messageKey3) {
      this.message3 = this.translateService.instant(data.extraLines.messageKey3, data.extraLines?.messageParams3);
    }
    if (data?.link) {
      this.link = data?.link;
    }
  }

  ngOnInit(): void {}

  doClose(): void {
    this.dialogRef.close();
  }
}
