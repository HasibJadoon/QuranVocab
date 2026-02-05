import { Component, Inject, OnInit } from '@angular/core';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';
import { IMeaning } from '../models/types.model';

@Component({
  selector: 'mcit-select-radio-modal',
  templateUrl: './select-radio-modal.component.html',
  styleUrls: ['./select-radio-modal.component.scss']
})
export class McitSelectRadioModalComponent implements OnInit {
  values: { name: IMeaning }[];

  constructor(private dialogRef: McitDialogRef<McitSelectRadioModalComponent, string>, @Inject(MCIT_DIALOG_DATA) data: any) {
    this.values = data.values;
  }

  ngOnInit(): void {}

  doSelect(value: any): void {
    this.dialogRef.close(value);
  }
}
