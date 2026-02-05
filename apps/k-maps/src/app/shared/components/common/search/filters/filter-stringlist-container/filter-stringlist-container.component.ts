import { Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FilterShowMode, IFilterStringList } from '../../search-options';
import { McitDialog } from '../../../dialog/dialog.service';
import { McitFilterStringlistEditModalComponent } from './filter-stringlist-edit-modal/filter-stringlist-edit-modal.component';
import * as lodash from 'lodash';

@Component({
  selector: 'mcit-filter-stringlist-search-container',
  templateUrl: './filter-stringlist-container.component.html',
  styleUrls: ['./filter-stringlist-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitFilterStringlistContainerComponent),
      multi: true
    }
  ]
})
export class McitFilterStringlistContainerComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input()
  key: string;
  @Input()
  filterConfig: IFilterStringList;
  @Input()
  initialFilter: any;
  @Input()
  mode: FilterShowMode;

  strings: string[];
  text: string;
  objectKey: string;

  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor(private dialog: McitDialog) {}

  ngOnInit(): void {
    this.strings = this.initialFilter ? this.initialFilter : null;
    this.objectKey = this.filterConfig.strings?.objectKey;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  writeValue(value: any) {
    const d = null;

    if (value) {
      if (this.filterConfig.strings.result === 'string') {
        this.strings = value.split(',');
      } else {
        this.strings = value;
      }
    } else {
      this.strings = d;
    }
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {}

  doRemove(text: string): void {
    this.strings = this.strings.filter((t) => t !== text);

    if (this.filterConfig.strings.result === 'string') {
      this.propagateChange(this.strings.length === 0 ? null : this.strings.join(','));
    } else {
      this.propagateChange(this.strings.length === 0 ? null : this.strings);
    }
  }

  doShowFilterStringListEditModal(): void {
    this.dialog
      .open(McitFilterStringlistEditModalComponent, {
        dialogClass: 'modal-l',
        disableClose: false,
        data: {
          list: this.strings,
          objectKey: this.objectKey
        }
      })
      .afterClosed()
      .subscribe((result) => {
        if (!lodash.isNil(result)) {
          if (result.length > 0) {
            this.strings = result;
          } else {
            this.strings = null;
          }
        }
        if (this.filterConfig.strings.result === 'string' && this.strings) {
          this.propagateChange(this.strings.join(','));
        } else {
          this.propagateChange(this.strings);
        }
      });
  }
}
