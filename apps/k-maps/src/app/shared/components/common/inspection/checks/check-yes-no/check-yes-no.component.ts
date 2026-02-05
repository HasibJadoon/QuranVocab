import { Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import * as lodash from 'lodash';
import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged, takeUntil, tap } from 'rxjs/operators';
import { ICheckQuestionYesNo, ICheckResultYesNo, ICheckResultYesNoChoice } from '../../inspection.model';
import { IAction, IAttachment } from '../../../models/attachments.model';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';

@TraceErrorClass()
@Component({
  selector: 'mcit-check-yes-no',
  templateUrl: './check-yes-no.component.html',
  styleUrls: ['./check-yes-no.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitCheckYesNoComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => McitCheckYesNoComponent),
      multi: true
    }
  ]
})
export class McitCheckYesNoComponent implements OnInit, OnDestroy {
  @Input() environment;
  @Input() defaultValue;
  @Input() yesNoQuestion: ICheckQuestionYesNo;
  @Input() isEditable$: Observable<boolean>;
  @Input() forceA4 = false;
  @Input() baseUrl: string;
  @Input() prefix_attach_url: string;
  @Input() suffix_attach_url: string;
  @Input() localMode = false;
  @Input() localAttachmentsDirectoryName: string;
  @Input() actions$: Observable<IAction[]> = null;

  @Output() attachAdded = new EventEmitter<IAttachment>();
  @Output() checkPathChanged = new EventEmitter<string>();
  checkForm: UntypedFormGroup;
  isShownAttachment = false;
  isShownComment = false;
  selectedValue: boolean;

  private destroy$: Subject<boolean> = new Subject<boolean>();
  private initValue = false;
  private yesNoStructure: { yes: ICheckResultYesNoChoice; no: ICheckResultYesNoChoice };
  private previousValue: boolean;

  constructor(private fb: UntypedFormBuilder) {}

  propagateChange: any = () => {};

  propagateTouch: any = () => {};

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  ngOnInit(): void {
    this.yesNoStructure = lodash.cloneDeep(this.buildChoicesStructureFromQuestion(this.yesNoQuestion));
    this.checkForm = this.fb.group({
      choice: this.fb.group({
        value: null,
        choice_attachment: null,
        choice_comment: null,
        choice_subcheck: this.fb.group({
          type: null,
          yes_no: null,
          unique_answer: null,
          multi_answers: null
        })
      })
    });

    this.checkForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((val: ICheckResultYesNo) => {
      this.selectedValue = val?.choice?.value;
      if (this.propagateChange && val?.choice?.value != null) {
        if (this.previousValue !== val.choice.value) {
          const initValue = this.previousValue == null;
          this.previousValue = lodash.clone(val.choice.value);
          const choiceStructure = lodash.cloneDeep(this.yesNoStructure)[val.choice.value ? 'yes' : 'no'];
          this.checkForm.patchValue({
            choice: {
              ...(initValue ? val : choiceStructure),
              choice_subcheck: initValue && val?.choice?.choice_subcheck?.type ? val?.choice?.choice_subcheck : choiceStructure.choice_subcheck
            }
          });
        } else {
          this.propagateChange(val);
        }
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

  buildChoicesStructureFromQuestion(yesNoQuestion: ICheckQuestionYesNo): {
    yes: ICheckResultYesNoChoice;
    no: ICheckResultYesNoChoice;
  } {
    if (yesNoQuestion) {
      return {
        yes: this.yesNoQuestion.yes
          ? {
              value: true,
              choice_attachment: [],
              choice_comment: '',
              choice_subcheck: {
                type: this.yesNoQuestion.yes.yes_subcheck ? this.yesNoQuestion.yes.yes_subcheck.type : null,
                yes_no: null,
                unique_answer: null,
                multi_answers: null
              }
            }
          : { value: true },
        no: this.yesNoQuestion.no
          ? {
              value: false,
              choice_attachment: [],
              choice_comment: '',
              choice_subcheck: {
                type: this.yesNoQuestion.no.no_subcheck ? this.yesNoQuestion.no.no_subcheck.type : null,
                yes_no: null,
                unique_answer: null,
                multi_answers: null
              }
            }
          : { value: false }
      };
    }
  }

  writeValue(value: any = {}) {
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
    this.propagateTouch = fn;
  }

  validate(c: UntypedFormControl) {
    const val = lodash.get(this.checkForm, 'value.choice.value', null);
    if (val !== null) {
      if (this.isCheckCommentValid(this.checkForm.value) && this.isCheckAttachmentValid(this.checkForm.value) && this.isSubcheckValid(this.checkForm)) {
        const path = val ? 'yes.yes_' : 'no.no_';
        if (this.isChoiceCommentValid(path, this.checkForm.value) && this.isChoiceAttachmentValid(path, this.checkForm.value)) {
          return null;
        } else {
          return { state: 'INVALID', valid: false };
        }
      } else {
        return { state: 'INVALID', valid: false };
      }
    }
    return { state: 'INCOMPLETE', valid: false };
  }

  isSubcheckValid(checkForm) {
    const subcheckForm = this.checkForm.get(['choice', 'choice_subcheck']);
    let subcheckValid = false;
    // The following is to handle sub form validation in cas it's disabled (i.e. on read-only forms)
    const subcheckFormDisabled = subcheckForm.disabled;
    if (subcheckFormDisabled) {
      subcheckForm.enable({ emitEvent: false });
    }
    subcheckValid = subcheckForm.valid;
    if (subcheckFormDisabled) {
      subcheckForm.disable({ emitEvent: false });
    }
    const subType = lodash.get(checkForm, 'value.choice.choice_subcheck.type', null);
    const sub = checkForm.value.choice.choice_subcheck;
    return subType === null || (sub[subType] !== null && subcheckValid);
  }

  onChoiceAttachListChanged(event: IAttachment[]): void {
    this.checkForm.get('choice').patchValue({ choice_attachment: event });
  }

  onAttachAdded(event: IAttachment): void {
    this.attachAdded.emit(event);
  }

  showAttachment(hasAttachment, isCurrent) {
    if (hasAttachment) {
      this.isShownAttachment = this.isShownAttachment === isCurrent ? '' : isCurrent;
    }
  }

  showComment(hasComment, isCurrent) {
    if (hasComment) {
      this.isShownComment = this.isShownComment === isCurrent ? '' : isCurrent;
    }
  }

  isCheckCommentValid(value): boolean {
    return lodash.get(this.yesNoQuestion, 'check_comment.required', false) === false || (lodash.get(this.yesNoQuestion, 'check_comment.required', false) && lodash.get(value, 'check_comment.length', false) > 0);
  }

  isCheckAttachmentValid(value): boolean {
    return lodash.get(this.yesNoQuestion, 'check_attachment.required', false) === false || (lodash.get(this.yesNoQuestion, 'check_attachment.required', false) && lodash.get(value, 'check_attachment.length', false) > 0);
  }

  isChoiceCommentValid(lodashVal, newValue): boolean {
    return lodash.get(this.yesNoQuestion, lodashVal + 'comment.required', false) === false || (lodash.get(this.yesNoQuestion, lodashVal + 'comment.required', false) && lodash.get(newValue, 'choice.choice_comment.length', false) > 0);
  }

  isChoiceAttachmentValid(lodashVal, newValue): boolean {
    return (
      lodash.get(this.yesNoQuestion, lodashVal + 'attachment.required', false) === false || (lodash.get(this.yesNoQuestion, lodashVal + 'attachment.required', false) && lodash.get(newValue, 'choice.choice_attachment.length', false) > 0)
    );
  }

  doChangeCheckPath(checkPath: string): void {
    this.checkPathChanged.emit(checkPath);
  }

  onCheckPathChanged(checkPath: string, childCheckPath: string): void {
    this.checkPathChanged.emit(checkPath + childCheckPath);
  }
}
