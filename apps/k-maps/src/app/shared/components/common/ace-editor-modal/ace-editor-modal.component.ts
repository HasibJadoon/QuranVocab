import { Component, Inject } from '@angular/core';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import * as lodash from 'lodash';

export interface IOptions {
  readonly?: boolean;
  noTranslate?: boolean;
  mode?: string;
}

@Component({
  selector: 'mcit-ace-editor-modal',
  templateUrl: './ace-editor-modal.component.html'
})
export class McitAceEditorModalComponent {
  public form: UntypedFormGroup;

  public options: IOptions;

  constructor(private dialogRef: McitDialogRef<McitAceEditorModalComponent, object>, @Inject(MCIT_DIALOG_DATA) public data: { title: string; object: any; options: IOptions }, private formBuiler: UntypedFormBuilder) {
    this.options = lodash.defaults(data.options, {
      readonly: true,
      noTranslate: true,
      mode: 'json'
    });

    this.form = formBuiler.group({
      value: [this.options?.mode === 'json' ? JSON.stringify(data.object, null, 2) : data.object?.toString()]
    });
  }

  doClose(): void {
    this.dialogRef.close();
  }

  doSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    const value = this.form.value.value;
    this.dialogRef.close(this.options?.mode === 'json' ? JSON.parse(value) : value);
  }
}
