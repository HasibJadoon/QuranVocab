import { Component, Inject, OnInit } from '@angular/core';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'mcit-info-modal',
  templateUrl: './list-info-modal.component.html',
  styleUrls: ['./list-info-modal.component.scss']
})
export class McitListInfoModalComponent implements OnInit {
  title: string;
  list: { k: string; v: string }[];

  constructor(
    private dialogRef: McitDialogRef<McitListInfoModalComponent, void>,
    private translateService: TranslateService,
    @Inject(MCIT_DIALOG_DATA)
    data: {
      title: string;
      list: { k: string; v: string }[];
    }
  ) {
    this.title = this.translateService.instant(data.title);
    this.list = data.list;
    data.list.map((element) => {
      this.translateService.instant(element.k), element.v;
    });
  }

  ngOnInit(): void {}

  doClose(): void {
    this.dialogRef.close();
  }
}
