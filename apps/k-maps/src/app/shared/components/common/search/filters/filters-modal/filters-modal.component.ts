import { Component, Inject, OnInit } from '@angular/core';
import { McitDialogRef } from '../../../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../../../dialog/dialog.service';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import * as lodash from 'lodash';
import { IFiltersModel } from '../../search-model';
import { IFiltersConfig } from '../../search-options';

@Component({
  selector: 'mcit-filters-search-modal',
  templateUrl: './filters-modal.component.html',
  styleUrls: ['./filters-modal.component.scss']
})
export class McitFiltersModalComponent implements OnInit {
  id: string;
  filtersConfig: IFiltersConfig;
  searchBox: string;
  filters: IFiltersModel;
  key: string;

  groupForm: UntypedFormGroup;

  constructor(private dialogRef: McitDialogRef<McitFiltersModalComponent>, @Inject(MCIT_DIALOG_DATA) data: any, private formBuilder: UntypedFormBuilder) {
    this.id = data.id;
    this.filtersConfig = data.filtersConfig;
    this.searchBox = data.searchBox;
    this.filters = data.filters;
    this.key = data.key;

    this.groupForm = this.formBuilder.group({
      filters: [lodash.cloneDeep(data.filters)]
    });
  }

  ngOnInit(): void {
    const initialValues = this.groupForm.get('filters').value;
    const hasValues = Object.values(initialValues).some((v) => v !== null && v !== undefined && v !== '');

    if (hasValues) {
      this.groupForm.markAsDirty();
    }
  }

  doClose(): void {
    this.dialogRef.close();
  }

  doClear(): void {
    const d = Object.keys(this.filtersConfig).reduce((acc, v) => {
      if (!this.key || v === this.key) {
        acc[v] = null;
      } else {
        acc[v] = this.filters[v];
      }
      return acc;
    }, {});

    this.dialogRef.close(d);
  }

  doApply(): void {
    this.dialogRef.close(this.groupForm.value.filters);
  }
}
