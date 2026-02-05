import { Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ControlValueAccessor, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators } from '@angular/forms';
import * as lodash from 'lodash';
import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged, takeUntil, tap } from 'rxjs/operators';
import { ICheckQuestionFreeText, ICheckResultFreetext } from '../../inspection.model';
import { IAction, IAttachment } from '../../../models/attachments.model';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';

@TraceErrorClass()
@Component({
  selector: 'mcit-check-free-text',
  templateUrl: './check-free-text.component.html',
  styleUrls: ['./check-free-text.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitCheckFreeTextComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => McitCheckFreeTextComponent),
      multi: true
    }
  ]
})
export class McitCheckFreeTextComponent implements OnInit, OnDestroy, ControlValueAccessor, Validators {
  @Input() environment;
  @Input() defaultValue: ICheckResultFreetext;
  @Input() freetextQuestion: ICheckQuestionFreeText;
  @Input() isEditable$: Observable<boolean>;
  @Input() forceA4 = false;
  @Input() baseUrl;
  @Input() prefix_attach_url: string;
  @Input() suffix_attach_url: string;
  @Input() localMode = false;
  @Input() localAttachmentsDirectoryName: string;
  @Input() actions$: Observable<IAction[]> = null;

  @Output() attachAdded = new EventEmitter<IAttachment>();
  checkForm: UntypedFormGroup;

  private destroy$: Subject<boolean> = new Subject<boolean>();
  private initValue = true;

  constructor(private fb: UntypedFormBuilder) {}

  propagateChange: any = () => {};
  onTouch: any = () => {};

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  ngOnInit() {
    this.checkForm = this.fb.group({
      value: null,
      check_attachment: null
    });

    this.checkForm.valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroy$)).subscribe((newValue) => {
      if (this.propagateChange) {
        this.propagateChange(newValue);
      }
    });

    this.isEditable$
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(),
        tap((editable) => {
          if (editable) {
            this.checkForm.enable();
          } else {
            this.checkForm.disable();
          }
        })
      )
      .subscribe();
  }

  writeValue(value: ICheckResultFreetext) {
    if (this.defaultValue && this.initValue) {
      this.checkForm.patchValue(this.defaultValue);
      this.initValue = false;
    }
    if (value) {
      this.checkForm.patchValue(value);
    }
  }

  registerOnChange(fn: any) {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouch = fn;
  }

  validate(c: UntypedFormControl) {
    const val = lodash.get(this.checkForm, 'value.value', false);
    if (this.freetextQuestion?.type === 'number' && val === 0) {
      return null;
    }
    const attValid = this.isCheckAttachmentValid(this.checkForm.value);
    if (val && attValid) {
      return null;
    }
    if (!val && lodash.get(this.checkForm.value, 'check_attachment.length', 0) === 0) {
      return { state: 'INCOMPLETE' };
    }
    return { state: 'INVALID' };
  }

  // onDocumentDeleted(event): void {
  //   this.checkAttachments = this.checkAttachments.filter(att => att.document_id !== event.document_id);
  //   this.checkForm.patchValue({ check_attachment: this.checkAttachments });
  // }

  onChoiceAttachListChanged(event: IAttachment[]): void {
    this.checkForm.patchValue({ check_attachment: event });
  }

  onAttachAdded(event: IAttachment): void {
    this.attachAdded.emit(event);
  }

  isCheckAttachmentValid(value): boolean {
    return lodash.get(this.freetextQuestion, 'check_attachment.required', false) === false || (lodash.get(this.freetextQuestion, 'check_attachment.required', false) && lodash.get(value, 'check_attachment.length', false) > 0);
  }
}
