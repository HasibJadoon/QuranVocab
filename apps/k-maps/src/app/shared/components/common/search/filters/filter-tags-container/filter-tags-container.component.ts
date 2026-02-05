import { Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FilterShowMode, IFilterTags } from '../../search-options';

@Component({
  selector: 'mcit-filter-tags-search-container',
  templateUrl: './filter-tags-container.component.html',
  styleUrls: ['./filter-tags-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitFilterTagsContainerComponent),
      multi: true
    }
  ]
})
export class McitFilterTagsContainerComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input()
  key: string;
  @Input()
  filterConfig: IFilterTags;
  @Input()
  initialFilter: any;
  @Input()
  mode: FilterShowMode;

  tags: string[];
  text: string;

  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor() {}

  ngOnInit(): void {
    this.tags = this.initialFilter ? this.initialFilter : null;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  writeValue(value: any) {
    const d = null;

    if (value) {
      if (this.filterConfig.tags.result === 'string') {
        this.tags = value.split(',');
      } else {
        this.tags = value;
      }
    } else {
      this.tags = d;
    }
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {}

  doAdd(text: string): boolean {
    if (!text) {
      return false;
    }
    if (!this.tags) {
      this.tags = [];
    }

    this.text = null;

    if (this.tags.find((t) => t === text)) {
      return false;
    }

    this.tags.push(this.filterConfig.tags.stringFormat ? this.filterConfig.tags.stringFormat(text) : text);
    if (this.filterConfig.tags.result === 'string') {
      this.propagateChange(this.tags.join(','));
    } else {
      this.propagateChange(this.tags);
    }
    return false;
  }

  doRemove(text: string): void {
    this.tags = this.tags.filter((t) => t !== text);

    if (this.filterConfig.tags.result === 'string') {
      this.propagateChange(this.tags.length === 0 ? null : this.tags.join(','));
    } else {
      this.propagateChange(this.tags.length === 0 ? null : this.tags);
    }
  }
}
