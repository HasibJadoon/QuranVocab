import { Component, forwardRef, Inject, OnDestroy, OnInit, Optional } from '@angular/core';
import { ControlValueAccessor, UntypedFormBuilder, UntypedFormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import * as lodash from 'lodash';
import { Subject } from 'rxjs';
import { MCIT_FILTER_CUSTOM_FILTER_CONFIG, MCIT_FILTER_CUSTOM_INITIAL_FILTER, MCIT_FILTER_CUSTOM_KEY, MCIT_FILTER_CUSTOM_MODE } from '../search/filters/filter-custom-container/filter-custom-container.component';
import { CodificationHttpService } from '../../../../../supervision/src/app/business/services/codification-http.service';
import { takeUntil } from 'rxjs/operators';
import { CodificationKind } from '../../../../../fvl/src/app/shared/components/codification-search-field/codification-search-field.component';
import { ITranscoding } from '../models/transcoding.model';
@Component({
  selector: 'mcit-transcoding-filter',
  templateUrl: './transcoding-filter.component.html',
  styleUrls: ['./transcoding-filter.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitTranscodingFilterComponent),
      multi: true
    }
  ]
})
export class McitTranscodingFilterComponent implements OnInit, OnDestroy, ControlValueAccessor {
  form: UntypedFormGroup;
  codificationKind: CodificationKind;
  noQuery: boolean;
  private default: any;
  private propagateChange: (_: any) => any;
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    @Inject(MCIT_FILTER_CUSTOM_KEY) public key: string,
    @Inject(MCIT_FILTER_CUSTOM_FILTER_CONFIG) public filterConfig: any,
    @Inject(MCIT_FILTER_CUSTOM_INITIAL_FILTER) @Optional() public initialFilter: any,
    @Inject(MCIT_FILTER_CUSTOM_MODE) public showMode: any,
    private formBuilder: UntypedFormBuilder,
    private codificationHttpService: CodificationHttpService
  ) {
    this.codificationKind = this.filterConfig.custom?.data?.codificationKind;
    this.noQuery = this.filterConfig.custom?.data?.noQuery;
    this.form = this.formBuilder.group({
      codification: this.noQuery ? '' : null,
      x_code: ''
    });
  }

  ngOnInit(): void {
    const value = lodash.defaultsDeep({}, this.initialFilter ? this.initialFilter : null, this.default);

    this.writeValue(value);

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((next) => this.checkPropagate(next));
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  private checkPropagate(value) {
    if (this.propagateChange) {
      if (value.codification || value.x_code) {
        this.propagateChange(
          lodash.omitBy(
            {
              entity: this.noQuery ? value.codification : value.codification?.code,
              x_code: value.x_code
            },
            lodash.isNil
          )
        );
      } else {
        this.propagateChange(null);
      }
    }
  }

  writeValue(value: ITranscoding) {
    if (value) {
      if (!this.noQuery && value.entity) {
        this.codificationHttpService.get(value.entity).subscribe((codification) =>
          this.form.setValue({
            codification,
            x_code: value.x_code ?? ''
          })
        );
      } else {
        this.form.setValue({
          codification: this.noQuery ? value?.entity ?? '' : null,
          x_code: value?.x_code ?? ''
        });
      }
    }
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {}
}
