import { Component, Inject, OnInit } from '@angular/core';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';

export interface IOption {
  code: string;
  name: string;
}

@Component({
  selector: 'mcit-multi-choose-options-modal',
  templateUrl: './choose-multi-options-modal.component.html',
  styleUrls: ['./choose-multi-options-modal.component.scss']
})
export class McitChooseMultiOptionsModalComponent implements OnInit {
  title: string;
  options: IOption[];
  codes: string[];

  constructor(private dialogRef: McitDialogRef<McitChooseMultiOptionsModalComponent, string[]>, @Inject(MCIT_DIALOG_DATA) data: any) {
    this.title = data.title;
    this.options = data.options;
    this.codes = data.codes;
  }

  ngOnInit(): void {}

  doChangeCode(code: string, event): void {
    this.codes = this.options
      .filter((o) => {
        if (o.code === code) {
          return event.target.checked;
        } else {
          return this.codes.indexOf(o.code) !== -1;
        }
      })
      .map((o) => o.code);
  }

  doFilter(): void {
    this.dialogRef.close(this.codes);
  }

  doClose(): void {
    this.dialogRef.close();
  }
}
