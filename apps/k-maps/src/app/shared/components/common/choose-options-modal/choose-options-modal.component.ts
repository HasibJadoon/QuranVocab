import { Component, Inject, OnInit } from '@angular/core';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';

export interface IItem {
  code: string;
  name: string;
  icone_name?: string;
  params?: any;
  noTranslate?: boolean;
}

export interface IOptions {
  dontTranslateNames?: boolean;
  allActive?: boolean;
  list_style?: string;
}

@Component({
  selector: 'mcit-choose-options-modal',
  templateUrl: './choose-options-modal.component.html',
  styleUrls: ['./choose-options-modal.component.scss']
})
export class McitChooseOptionsModalComponent implements OnInit {
  title: string;
  values: IItem[];
  code: string;
  options: IOptions;

  constructor(private dialogRef: McitDialogRef<McitChooseOptionsModalComponent, string>, @Inject(MCIT_DIALOG_DATA) data: any) {
    this.title = data.title;
    this.values = data.values;
    this.code = data.code;
    this.options = data.options;
  }

  ngOnInit(): void {}

  doChooseOption(code: string): void {
    this.dialogRef.close(code);
  }

  doClose(): void {
    this.dialogRef.close();
  }
}
