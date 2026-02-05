import * as lodash from 'lodash';
import { Component, Inject } from '@angular/core';
import { Workbook } from 'exceljs';
import { from } from 'rxjs';
import { LocalUploadService } from './local-upload.service';
import { filter } from 'rxjs/operators';
import { McitPopupService } from '../services/popup.service';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';

const MAX_LINES = 500;

export interface IMultipleFiltersModalOptions {
  maxLine?: number;
  defaultReferenceType?: string;
  importLines?: boolean;
  importToolTipText?: string;
}

export interface IReferenceTypes {
  [key: string]: IReferenceType;
}

export interface IReferenceType {
  nameKey: string;
}

export interface IMultipleFilters {
  [key: string]: IMultipleFilter;
}

export interface IMultipleFilter {
  value: string[];
  withFiles: boolean;
}

@Component({
  selector: 'mcit-multiple-filters-modal',
  templateUrl: './multiple-filters-modal.component.html',
  styleUrls: ['./multiple-filters-modal.component.scss']
})
export class McitMultipleFiltersModalComponent {
  referenceTypes: { [key: string]: IReferenceType };

  selectedFiltersType: string;
  referenceFilterList = '';

  allFilters: IMultipleFilters;

  codeMirrorOptions = {
    lineNumbers: true,
    theme: 'default',
    readOnly: false
  };

  importToolTipText: string;

  private options: IMultipleFiltersModalOptions;

  constructor(private popupService: McitPopupService, private localUploadService: LocalUploadService, private dialogRef: McitDialogRef<McitMultipleFiltersModalComponent>, @Inject(MCIT_DIALOG_DATA) data: any) {
    this.referenceTypes = data.referenceTypes ?? {};
    this.allFilters = data?.filters ?? {};
    this.importToolTipText = data?.options?.importToolTipText ? data?.options?.importToolTipText : 'MULTIPLE_FILTERS_MODAL.UPLOAD_FILE';
    this.options = {
      maxLine: data.options?.maxLine ? data.options.maxLine : 500,
      importLines: data.options?.importLines === false ? data.options.importLines : true,
      defaultReferenceType: data.options?.defaultReferenceType ? data.options?.defaultReferenceType : null
    };
    const defaultSelectedReferenceType = Object.keys(this.referenceTypes)?.find((referenceType) => Object.keys(this.allFilters)?.[0] === referenceType);
    this.selectedFiltersType = this.options?.defaultReferenceType ?? defaultSelectedReferenceType ?? lodash.head(Object.keys(this.referenceTypes));

    const selectedFilters = this.allFilters[this.selectedFiltersType];
    this.referenceFilterList = selectedFilters?.value?.join('\n') ?? '';
    this.codeMirrorOptions.readOnly = selectedFilters?.withFiles;
  }

  getNbMaxLines(): number {
    return this.options?.maxLine ?? MAX_LINES;
  }

  getNbLines(): number {
    return this.referenceFilterList.split('\n').length;
  }

  isMaxLineReached(): boolean {
    return this.referenceFilterList ? this.getNbLines() >= this.getNbMaxLines() : false;
  }

  onChange(fromFiles: boolean = false): void {
    let filterUpdated = this.allFilters[this.selectedFiltersType];
    if (this.referenceFilterList !== '') {
      if (filterUpdated) {
        filterUpdated.value = lodash.uniq(this.referenceFilterList.split('\n').filter((str) => str.trim() !== ''));
        filterUpdated.withFiles = fromFiles;
      } else {
        filterUpdated = {
          value: lodash.uniq(this.referenceFilterList.split('\n').filter((str) => str.trim() !== '')),
          withFiles: fromFiles
        };
        this.allFilters[this.selectedFiltersType] = filterUpdated;
      }
      this.codeMirrorOptions.readOnly = fromFiles;
    } else {
      delete this.allFilters[this.selectedFiltersType];
    }

    this.setLimitsToText();
  }

  doChangeReferencesTypes(type: string): void {
    this.selectedFiltersType = type;
    const selectedFilters = this.allFilters[this.selectedFiltersType];
    this.referenceFilterList = selectedFilters?.value?.join('\n') ?? '';
    this.codeMirrorOptions.readOnly = selectedFilters?.withFiles;
  }

  setLimitsToText(): void {
    const textBrut = this.referenceFilterList ? this.referenceFilterList : '';
    let lines = textBrut.split('\n');
    if (lines.length > this.getNbMaxLines()) {
      lines = lines.slice(0, this.getNbMaxLines());
    }
    this.referenceFilterList = lines.join('\n');
  }

  onUploadEnded(event: any): void {
    const file = event.target.files?.[0] as File;
    this.localUploadService
      .upload(file)
      .pipe(filter((res) => !!res?.response))
      .subscribe((res) => {
        if (res?.response?.status === 200 && res?.name.split('.').pop().toLowerCase() === 'xlsx') {
          this.getReferencesValuesFromExcel(res?.response?.body);
          this.popupService.showSuccess('MULTIPLE_FILTERS_MODAL.UPLOAD_FILE_SUCCESS');
        } else {
          this.popupService.showError();
        }
      });
    event.target.value = '';
  }

  private getReferencesValuesFromExcel(data: ArrayBuffer): void {
    const workbook = new Workbook();
    from(workbook.xlsx.load(data)).subscribe((wb) => {
      const worksheet = wb.worksheets[0];
      const referencesValues: string[] = [];

      worksheet.eachRow((row, rowNumber) => {
        const value = row.getCell(1).value.toString();
        if (value !== '') {
          referencesValues.push(value);
        }
      });
      this.referenceFilterList = lodash.uniq(referencesValues.filter((str) => str.trim() !== '')).join('\n');
      this.onChange(true);
    });
  }

  doClearFilter(event: any, type?: string): void {
    event.stopPropagation();
    delete this.allFilters[type ?? this.selectedFiltersType];
    this.referenceFilterList = '';
    this.codeMirrorOptions.readOnly = false;
  }

  doClearAllFilters(): void {
    this.allFilters = {};
    this.referenceFilterList = '';
    this.codeMirrorOptions.readOnly = false;
  }

  doPaste(): void {
    navigator.clipboard.readText().then((clipboard) => {
      this.referenceFilterList = lodash.uniq(clipboard.split('\n').filter((str) => str.trim() !== '')).join('\n');
      this.onChange();
    });
  }

  doApplyFilters(): void {
    Object.values(this.allFilters)?.forEach((multipleFilter) => (multipleFilter.value = multipleFilter.value.map((v) => v.trim())));
    this.dialogRef.close(this.allFilters);
  }

  doClose(): void {
    this.dialogRef.close();
  }
}
