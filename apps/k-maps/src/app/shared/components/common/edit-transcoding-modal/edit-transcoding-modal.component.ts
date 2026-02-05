import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { isEqual, uniqWith } from 'lodash';
import { ITranscoding } from '../models/transcoding.model';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';
import { Observable } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { McitPopupService } from '../services/popup.service';

@Component({
  selector: 'mcit-edit-transcoding-modal',
  templateUrl: './edit-transcoding-modal.component.html',
  styleUrls: ['./edit-transcoding-modal.component.scss']
})
export class McitEditTranscodingModalComponent implements OnInit {
  form: UntypedFormGroup;
  transcoding: ITranscoding[];
  readOnly: boolean;
  autocomplete: (s) => Observable<HttpResponse<any[]>>;
  exportCallback?: () => void;
  exportLabel?: string;
  showOutgoingTranscoding: boolean = false;
  showExternalName: boolean = false;

  constructor(
    private dialogRef: McitDialogRef<McitEditTranscodingModalComponent>,
    @Inject(MCIT_DIALOG_DATA)
    data: { 
      transcoding: ITranscoding[]; 
      readOnly: boolean; 
      autocomplete: (s) => Observable<HttpResponse<any[]>>; 
      exportCallback?: () => void; 
      exportLabel?: string;
      showOutgoingTranscoding?: boolean; 
      showExternalName?: boolean;
    },
    private formBuilder: UntypedFormBuilder,
    private popupService: McitPopupService
  ) {
    this.transcoding = data?.transcoding ?? [];
    this.readOnly = data?.readOnly ?? false;
    this.autocomplete = data?.autocomplete;
    this.exportCallback = data?.exportCallback;
    this.exportLabel = data?.exportLabel;
    this.showOutgoingTranscoding = data?.showOutgoingTranscoding ?? false;
    this.showExternalName = data?.showExternalName ?? false;
  }

  ngOnInit(): void {
    const formControls: any = {
      entity: ['', Validators.required],
      x_code: ['', Validators.required]
    };

    if (this.showOutgoingTranscoding) {
      formControls.check_outgoing_transcoding = [false];
    }

    if (this.showExternalName) {
      formControls.x_name = [''];
    }

    this.form = this.formBuilder.group(formControls);
  }

  doSave(): void {
    // If external name is not enabled, ensure it's cleared from all transcoding items
    if (!this.showExternalName && this.transcoding) {
      this.transcoding = this.transcoding.map(item => {
        const { x_name, ...rest } = item;
        return rest;
      });
    }
    this.dialogRef.close(this.transcoding);
  }

  doClose(): void {
    this.dialogRef.close();
  }

  doAddTranscoding(): void {
    const transcoding: ITranscoding = this.form.value;
    if (!this.transcoding) {
      this.transcoding = [];
    }
    
    // Trim all text fields
    if (transcoding?.entity) {
      transcoding['entity'] = transcoding.entity.trim();
    }
    if (transcoding?.x_code) {
      transcoding['x_code'] = transcoding.x_code.trim();
    }
    if (this.showExternalName && transcoding?.x_name) {
      transcoding['x_name'] = transcoding.x_name.trim();
    }
    
    // If outgoing transcoding is not enabled, ensure it's set to false
    if (!this.showOutgoingTranscoding) {
      transcoding.check_outgoing_transcoding = false;
    }
    
    // If external name is not enabled, ensure it's not saved
    if (!this.showExternalName) {
      transcoding.x_name = undefined;
    }
    
    // Check for duplicate outgoing transcoding only if enabled
    if (this.showOutgoingTranscoding && this.isDuplicateOutgoingTranscoding(transcoding)) {
      this.popupService.show('error', 'EDIT_TRANSCODING.DUPLICATE_OUTGOING_TRANSCODING');
      return;
    }
    
    this.transcoding.push(transcoding);
    this.transcoding = uniqWith(this.transcoding, isEqual);
    this.form.reset();
    const resetValues: any = {
      entity: '',
      x_code: ''
    };
    if (this.showOutgoingTranscoding) {
      resetValues.check_outgoing_transcoding = false;
    }
    if (this.showExternalName) {
      resetValues.x_name = '';
    }
    this.form.patchValue(resetValues);
  }

  private isDuplicateOutgoingTranscoding(newTranscoding: ITranscoding): boolean {
    // Only check for duplicates if the new transcoding has outgoing transcoding enabled
    if (!newTranscoding.check_outgoing_transcoding) {
      return false;
    }
    
    // Check if there's already an outgoing transcoding with the same entity
    return this.transcoding.some(existing => 
      existing.check_outgoing_transcoding && 
      existing.entity === newTranscoding.entity
    );
  }

  doDeleteTranscoding(index: number): void {
    this.transcoding = this.transcoding.filter((v, i) => i !== index);
  }

  writeValueMapping = (o) => ({ code: o });

  doExport(): void {
    if (this.exportCallback) {
      this.exportCallback();
    }
  }
}
