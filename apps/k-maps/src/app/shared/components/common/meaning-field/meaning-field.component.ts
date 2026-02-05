import { Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AbstractControl, ControlValueAccessor, UntypedFormBuilder, UntypedFormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import * as lodash from 'lodash';
import { LANGUAGES } from '../models/language';
import { McitMenuDropdownService } from '../menu-dropdown/menu-dropdown.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'mcit-meaning-field',
  templateUrl: './meaning-field.component.html',
  styleUrls: ['./meaning-field.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitMeaningFieldComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => McitMeaningFieldComponent),
      multi: true
    }
  ]
})
export class McitMeaningFieldComponent implements OnInit, OnDestroy, ControlValueAccessor, Validator {
  private _required = false;
  private _mode: string = this.translateService.currentLang || '**';

  @Input() submitAttempt: boolean;
  @Input() disableLangOpt = false;
  @Input()
  set mode(_mode: string) {
    this._mode = _mode;
  }
  get mode(): string {
    return this._mode;
  }

  @Input()
  set required(_required: boolean) {
    this._required = _required;

    if (_required) {
      this.meaningFieldForm.setValidators((control: AbstractControl): ValidationErrors => (lodash.isEmpty(lodash.omitBy(control.value, lodash.isEmpty)) ? { required: true } : null));
    } else {
      this.meaningFieldForm.clearValidators();
    }
  }

  get required(): boolean {
    return this._required;
  }

  @Input() showResume = false;
  @Input() placeholder = '';
  @Output() selectedLangChange: EventEmitter<string> = new EventEmitter<string>();

  meaningFieldForm: UntypedFormGroup;

  languages = LANGUAGES;

  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor(private formBuilder: UntypedFormBuilder, private menuDropdownService: McitMenuDropdownService, private translateService: TranslateService) {
    this.meaningFieldForm = this.formBuilder.group({
      default: [''],
      ...this.languages.reduce((acc, x) => {
        acc[x.code] = [''];
        return acc;
      }, {})
    });
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.meaningFieldForm.valueChanges.subscribe((next) => {
        if (this.propagateChange) {
          if (!next['default']) {
            next['default'] = next[this.translateService.currentLang];
          }
          this.propagateChange(lodash.omitBy(next, lodash.isEmpty));
        }
      })
    );
    this.mode = this.translateService.currentLang;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((data) => data.unsubscribe());
  }

  writeValue(value: any): void {
    if (value) {
      this.meaningFieldForm.setValue(
        {
          default: value.default || '',
          ...this.languages
            .filter((l) => value.l == null)
            .reduce((acc, x) => {
              acc[x.code] = '';
              return acc;
            }, {}),
          ...lodash.pickBy(value, (v, k) => this.languages.find((l) => l.code === k))
        },
        { emitEvent: false }
      );
    } else {
      this.meaningFieldForm.setValue(
        {
          default: '',
          ...this.languages.reduce((acc, x) => {
            acc[x.code] = '';
            return acc;
          }, {})
        },
        { emitEvent: false }
      );
    }
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  validate(control: AbstractControl): ValidationErrors | null {
    return this.meaningFieldForm.valid ? null : { custom: true };
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.meaningFieldForm.disable({ emitEvent: false });
    } else {
      this.meaningFieldForm.enable({ emitEvent: false });
    }
  }

  doChangeMode(modeButton: any): void {
    const data = this.meaningFieldForm.getRawValue();
    this.menuDropdownService
      .chooseOptions(modeButton, [
        { code: '**', nameKey: 'LANGUAGES.default', icon: data.default ? 'fa-check' : null },
        ...this.languages.map((l) => ({
          code: l.code,
          nameKey: l.name,
          icon: data[l.code] ? 'fa-check' : null
        }))
      ])
      .subscribe((key) => {
        if (key) {
          this.mode = key;
          this.selectedLangChange.emit(this.mode);
        }
      });
  }

  getNotEmpty(): string {
    const res = ['default', ...this.languages.map((l) => l.code)]
      .filter((l) => this.meaningFieldForm.get(l).value)
      .map((l) => {
        if (l === 'default') {
          return '*';
        }
        return lodash.capitalize(l);
      })
      .join('');
    return res ? res : '-';
  }
}
