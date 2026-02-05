import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { uniq } from 'lodash';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';

@Component({
  selector: 'mcit-edit-string-list-modal',
  templateUrl: './edit-string-list-modal.component.html',
  styleUrls: ['./edit-string-list-modal.component.scss']
})
export class McitEditStringListModalComponent implements OnInit {
  formGroup: UntypedFormGroup;
  strings: string[];
  readOnly: boolean;

  constructor(private dialogRef: McitDialogRef<McitEditStringListModalComponent>, @Inject(MCIT_DIALOG_DATA) data: { strings: string[]; readOnly: boolean }, private formBuilder: UntypedFormBuilder) {
    this.strings = data?.strings ?? [];
    this.readOnly = data?.readOnly ?? false;
  }

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      value: ['', Validators.required]
    });
  }

  doSave(): void {
    this.dialogRef.close(this.strings);
  }

  doClose(): void {
    this.dialogRef.close();
  }

  doAddValue(): void {
    const value = this.formGroup.value.value;
    if (!this.strings) {
      this.strings = [];
    }
    this.strings.push(value);
    this.strings = uniq(this.strings);
    this.formGroup.get('value').setValue('');
  }

  doDeleteValue(index: number): void {
    this.strings = this.strings.filter((v, i) => i !== index);
  }
}
