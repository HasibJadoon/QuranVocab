import { Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { distinctUntilChanged, takeUntil, tap } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import * as lodash from 'lodash';
import { ICheckQuestionAttachment, ICheckResultAttachment } from '../../inspection.model';
import { IDocumentLink } from '../../../models/types.model';
import { IAction, IAttachment } from '../../../models/attachments.model';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';

@TraceErrorClass()
@Component({
  selector: 'mcit-check-attachment',
  templateUrl: './check-attachment.component.html',
  styleUrls: ['./check-attachment.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitCheckAttachmentComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => McitCheckAttachmentComponent),
      multi: true
    }
  ]
})
export class McitCheckAttachmentComponent implements OnInit, OnDestroy {
  @Input() environment;
  @Input() defaultValue: ICheckResultAttachment;
  @Input() attachmentQuestion: ICheckQuestionAttachment;
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
  private valueAttachments: Array<IDocumentLink> = [];

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
      check_comment: null
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

  writeValue(value: ICheckResultAttachment) {
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
    if (val && val.length > 0 && this.isCheckCommentValid(this.checkForm.value)) {
      return null;
    }
    if ((val === null || val.length === 0) && lodash.get(this.checkForm.value, 'check_comment.length', 0) === 0) {
      return { state: 'INCOMPLETE' };
    }
    return { state: 'INVALID' };
  }

  // onDocumentDeleted(event): void {
  //   this.valueAttachments = this.valueAttachments.filter(att => att.document_id !== event.document_id);
  //   this.checkForm.patchValue({ value: this.valueAttachments });
  // }

  onChoiceAttachListChanged(event: IAttachment[]): void {
    this.checkForm.patchValue({ value: event });
  }

  onAttachAdded(event: IAttachment): void {
    this.attachAdded.emit(event);
  }

  isCheckCommentValid(value): boolean {
    return lodash.get(this.attachmentQuestion, 'check_comment.required', false) === false || (lodash.get(this.attachmentQuestion, 'check_comment.required', false) && lodash.get(value, 'check_comment.length', false) > 0);
  }
}
