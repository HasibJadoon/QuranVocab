import { Component, Inject } from '@angular/core';
import { uniq } from 'lodash';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';
import { McitPopupService } from '../services/popup.service';

const MAX_LINES = 500;

export interface IMultipleVinsModalOptions {
  maxLine?: number;
}

export interface IReferenceTypes {
  [key: string]: IReferenceType;
}

export interface IReferenceType {
  nameKey: string;
}

@Component({
  selector: 'mcit-multiple-vins-modal',
  templateUrl: './multiple-vins-modal.component.html',
  styleUrls: ['./multiple-vins-modal.component.scss']
})
export class McitMultipleVinsModalComponent {
  referenceVinList = '';

  allVins: string[] = [];

  codeMirrorOptions = {
    lineNumbers: true,
    theme: 'default',
    readOnly: false
  };

  private options: IMultipleVinsModalOptions;

  constructor(private popupService: McitPopupService, private dialogRef: McitDialogRef<McitMultipleVinsModalComponent>, @Inject(MCIT_DIALOG_DATA) data: any) {
    this.options = {
      maxLine: data.options?.maxLine ? data.options.maxLine : 500
    };
  }

  getNbMaxLines(): number {
    return this.options?.maxLine ?? MAX_LINES;
  }

  getNbLines(): number {
    return this.referenceVinList.split('\n').length;
  }

  isMaxLineReached(): boolean {
    return this.referenceVinList ? this.getNbLines() >= this.getNbMaxLines() : false;
  }

  onChange(fromFiles: boolean = false): void {
    let filterUpdated = this.allVins;
    if (this.referenceVinList !== '') {
      filterUpdated = uniq(this.referenceVinList.split('\n').filter((str) => str.trim() !== ''));
      this.allVins = filterUpdated;

      this.codeMirrorOptions.readOnly = fromFiles;
    } else {
      this.allVins = [];
    }

    this.setLimitsToText();
  }

  setLimitsToText(): void {
    const textBrut = this.referenceVinList ? this.referenceVinList : '';
    let lines = textBrut.split('\n');
    if (lines.length > this.getNbMaxLines()) {
      lines = lines.slice(0, this.getNbMaxLines());
    }
    this.referenceVinList = lines.join('\n');
  }

  doClearVin(event: any): void {
    event.stopPropagation();
    this.allVins = [];
    this.referenceVinList = '';
    this.codeMirrorOptions.readOnly = false;
  }

  doPaste(): void {
    navigator.clipboard.readText().then((clipboard) => {
      this.referenceVinList = uniq(clipboard.split('\n').filter((str) => str.trim() !== '')).join('\n');
      this.onChange();
    });
  }

  doApplyVins(): void {
    Object.values(this.allVins)?.map((v) => v.trim());
    this.dialogRef.close(this.allVins);
  }

  doClose(): void {
    this.dialogRef.close();
  }
}
