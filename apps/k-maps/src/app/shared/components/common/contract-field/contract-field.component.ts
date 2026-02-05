import { Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AbstractControl, ControlValueAccessor, UntypedFormBuilder, UntypedFormGroup, NG_VALUE_ACCESSOR, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { EMPTY, Observable, Subscription } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { McitPopupService } from '../services/popup.service';
import * as lodash from 'lodash';
import { McitMeaningPipe } from '../common/pipes/meaning.pipe';
import { ContractsHttpService, ISearchContractsFilters } from '../contract/services/contracts-http.service';
import { IContract } from '../contract/contract.model';

@Component({
  selector: 'mcit-contract-field',
  templateUrl: './contract-field.component.html',
  styleUrls: ['./contract-field.component.scss'],
  providers: [
    McitMeaningPipe,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitContractFieldComponent),
      multi: true
    }
  ]
})
export class McitContractFieldComponent implements OnInit, OnDestroy, ControlValueAccessor {
  private _required = false;

  @Input() filters?: ISearchContractsFilters;

  @Input() placeholder: string;
  @Input() submitAttempt: boolean;

  @Input()
  set required(_required: boolean) {
    this._required = _required;

    this.contractFieldForm.get('contract').setValidators(Validators.compose(lodash.compact([this.validateContract(), _required ? Validators.required : null])));
  }

  get required(): boolean {
    return this._required;
  }

  @Output() contractEvent = new EventEmitter<any>();

  contractFieldForm: UntypedFormGroup;

  contractDataSource: Observable<any>;
  contractLoading = false;

  private contract: any;
  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor(private formBuilder: UntypedFormBuilder, private popupService: McitPopupService, private contractHttpService: ContractsHttpService, private meaningPipe: McitMeaningPipe) {
    this.contractFieldForm = this.formBuilder.group({
      contract: ['', Validators.compose(lodash.compact([this.validateContract(), this.required ? Validators.required : null]))]
    });
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.contractFieldForm.get('contract').valueChanges.subscribe((value) => {
        if (value?.length === 0 && this.contract) {
          this.doClearContract();
        }
      })
    );

    this.contractDataSource = new Observable((observer: any) => {
      observer.next(this.contractFieldForm.controls['contract'].value);
    }).pipe(switchMap((token: string) => this.getAutocompleteQuery$(token)));
  }

  private validateContract(): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => {
      if (!c.value || this.contract) {
        return null;
      }
      return { contract: true };
    };
  }

  private getAutocompleteQuery$(input: string): Observable<any> {
    return this.contractHttpService.search(input, 1, 5, this.filters ?? {}, '', '').pipe(
      map((resp) => resp.body),
      map((cs) =>
        cs.map((c) => ({
          _id: c._id,
          code: c.code,
          name: c.name,
          displayValue: this.generateCodeName(c)
        }))
      ),
      catchError((err, cause) => {
        this.popupService.showError();
        return EMPTY;
      })
    );
  }

  getContractErrorMessage(): string {
    const c = this.contractFieldForm.controls['contract'];
    if (c.hasError('required')) {
      return 'COMMON.FIELD_IS_MANDATORY';
    } else if (c.hasError('contract')) {
      return 'COMMON.CONTRACT_IS_WRONG';
    }
    return null;
  }

  doChangeContractLoading(event: boolean): void {
    this.contractLoading = event;
  }

  doContractSelected(event): void {
    const contract = event.item;
    this.loadContract(contract._id);
  }

  private loadContract(contract: string): void {
    this.contractLoading = true;

    this.contractHttpService.getContract(contract).subscribe(
      (next) => {
        this.contractLoading = false;

        this.contract = next;

        this.contractEvent.emit(next);

        this.contractFieldForm.controls['contract'].updateValueAndValidity();

        this.propagateChange(next);
      },
      (err) => {
        this.contractLoading = false;

        this.popupService.showError();
      }
    );
  }

  doClearContract(): void {
    this.contractFieldForm.controls['contract'].setValue(null);
    this.contract = null;

    this.contractEvent.emit(null);

    this.propagateChange(null);
  }

  writeValue(value: any) {
    if (value) {
      this.contract = value;
      this.contractFieldForm.controls['contract'].setValue(this.generateCodeName(value), { emitEvent: false });
    } else {
      this.contract = null;
      this.contractFieldForm.controls['contract'].setValue('', { emitEvent: false });
    }
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.contractFieldForm.controls['contract'].disable({ emitEvent: false });
    } else {
      this.contractFieldForm.controls['contract'].enable({ emitEvent: false });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  private generateCodeName(contract?: IContract) {
    if (!contract?.code || !contract?.name) {
      return '';
    }

    return `${contract.code} / ${contract.name}`;
  }
}
