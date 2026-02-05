import { Component, ElementRef, Inject, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { McitDropdownRef } from '../../../dropdown/dropdown-ref';
import { MCIT_DROPDOWN_DATA } from '../../../dropdown/dropdown.service';
import { UntypedFormBuilder, FormControl, UntypedFormGroup } from '@angular/forms';
import * as lodash from 'lodash';
import ResizeSensor, { ResizeSensorCallback } from 'css-element-queries/src/ResizeSensor';
import { IFiltersModel } from '../../search-model';
import { IFilterCustom, IFiltersConfig } from '../../search-options';

@Component({
  selector: 'mcit-filters-search-dropdown',
  templateUrl: './filters-dropdown.component.html',
  styleUrls: ['./filters-dropdown.component.scss']
})
export class McitFiltersDropdownComponent implements OnInit, OnDestroy {
  @ViewChild('content', { static: true })
  content: ElementRef;

  id: string;
  filtersConfig: IFiltersConfig;
  searchBox: string;
  filters: IFiltersModel;
  key: string;
  width: string;
  minWidth: string;
  maxWidth: string;
  maxHeight: string;

  groupForm: UntypedFormGroup;

  private resizeSensor: ResizeSensor;
  private resizeSensorCallback: ResizeSensorCallback;

  constructor(private dropdownRef: McitDropdownRef<McitFiltersDropdownComponent>, @Inject(MCIT_DROPDOWN_DATA) data: any, private formBuilder: UntypedFormBuilder) {
    this.id = data.id;
    this.filtersConfig = data.filtersConfig;
    this.searchBox = data.searchBox;
    this.filters = data.filters;
    this.key = data.key;

    const myFilter: IFilterCustom = this.filtersConfig[this.key] as IFilterCustom;
    this.width = data?.width ?? myFilter?.custom?.data?.width;
    this.minWidth = data.minWidth ?? myFilter?.custom?.data?.minWidth;
    this.maxWidth = data.maxWidth ?? myFilter?.custom?.data?.maxWidth;
    this.maxHeight = data.maxHeight ?? myFilter?.custom?.data?.maxHeight;

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

    this.resizeSensorCallback = (size) => {
      this.dropdownRef.updatePosition();
    };
    this.resizeSensor = new ResizeSensor(this.content.nativeElement, this.resizeSensorCallback);
  }

  ngOnDestroy(): void {
    this.resizeSensor.detach(this.resizeSensorCallback);
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

    this.dropdownRef.close(d);
  }

  doApply(): void {
    this.dropdownRef.close(this.groupForm.value.filters);
  }
}
