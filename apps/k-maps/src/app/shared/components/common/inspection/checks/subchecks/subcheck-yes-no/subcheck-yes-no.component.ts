import { Component, Input, OnInit, forwardRef, OnDestroy, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, UntypedFormControl, NG_VALUE_ACCESSOR, NG_VALIDATORS } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import * as lodash from 'lodash';
import { distinctUntilChanged, takeUntil, tap } from 'rxjs/operators';
import { ISubcheckResultYesNo, ISubcheckQuestionYesNo, ISubcheckResultYesNoChoice } from '../../../inspection.model';
import { IAction, IAttachment } from '../../../../models/attachments.model';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';

@TraceErrorClass()
@Component({
  selector: 'mcit-subcheck-yes-no',
  templateUrl: './subcheck-yes-no.component.html',
  styleUrls: ['./subcheck-yes-no.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitSubcheckYesNoComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => McitSubcheckYesNoComponent),
      multi: true
    }
  ]
})
export class McitSubcheckYesNoComponent implements OnInit, OnDestroy, AfterViewInit {
  constructor(private fb: UntypedFormBuilder) {}

  @Input() environment;
  @Input() defaultValue: ISubcheckResultYesNo;
  @Input() yesNoSubcheckQuestion: ISubcheckQuestionYesNo;
  @Input() isEditable$: Observable<boolean>;
  @Input() forceA4 = false;
  @Input() baseUrl: string;
  @Input() prefix_attach_url: string;
  @Input() suffix_attach_url: string;
  @Input() localMode = false;
  @Input() localAttachmentsDirectoryName: string;
  @Input() actions$: Observable<IAction[]> = null;

  @Output() attachAdded = new EventEmitter<IAttachment>();
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private initValue = true;
  private previousValue: boolean;
  private yesNoSubcheckStructure: any;

  subcheckForm: UntypedFormGroup;
  isShownAttachment = false;
  isShownComment = false;
  selectedValue: boolean;

  propagateChange: any = () => {};
  propagateTouch: any = () => {};

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  ngOnInit(): void {
    this.yesNoSubcheckStructure = lodash.cloneDeep(this.buildChoiceStructureFromQuestion());
    this.subcheckForm = this.fb.group({
      choice: this.fb.group({
        value: null,
        choice_attachment: null,
        choice_comment: null
      }),
      subcheck_attachment: null,
      subcheck_comment: null
    });

    this.isEditable$
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(),
        tap((editable) => {
          if (editable) {
            this.subcheckForm.enable();
          } else {
            this.subcheckForm.disable();
          }
        })
      )
      .subscribe();
  }

  ngAfterViewInit(): void {
    this.subcheckForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((val: ISubcheckResultYesNo) => {
      this.selectedValue = val?.choice?.value;
      if (this.propagateChange && val?.choice?.value != null) {
        if (this.previousValue !== val.choice.value) {
          const initValue = this.previousValue == null;
          this.previousValue = lodash.clone(val.choice.value);
          const choiceStructure = lodash.cloneDeep(this.yesNoSubcheckStructure)[val.choice.value ? 'yes' : 'no'];
          if (choiceStructure) {
            this.subcheckForm.patchValue({ choice: initValue ? val : choiceStructure });
          }
        } else {
          this.propagateChange(val);
        }
      }
    });
  }

  buildChoiceStructureFromQuestion(): { yes: ISubcheckResultYesNoChoice; no: ISubcheckResultYesNoChoice } {
    if (this.yesNoSubcheckQuestion) {
      return {
        yes: this.yesNoSubcheckQuestion.yes
          ? {
              value: true,
              choice_attachment: [],
              choice_comment: ''
            }
          : { value: true },
        no: this.yesNoSubcheckQuestion.no
          ? {
              value: false,
              choice_attachment: [],
              choice_comment: ''
            }
          : { value: false }
      };
    }
  }

  writeValue(value: ISubcheckResultYesNo) {
    if (this.defaultValue && this.initValue) {
      this.subcheckForm.patchValue(this.defaultValue, { emitEvent: false });
      this.selectedValue = this.defaultValue?.choice?.value;
      this.initValue = false;
    }
    if (value) {
      this.subcheckForm.patchValue(value, { emitEvent: false });
      this.selectedValue = value?.choice?.value;
    }
  }

  registerOnChange(fn: any) {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any) {
    this.propagateTouch = fn;
  }

  validate(c: UntypedFormControl) {
    const choiceVal = lodash.get(this.subcheckForm, 'value.choice.value', null);
    if (choiceVal !== null) {
      const lodashVal = choiceVal ? 'yes.yes_' : 'no.no_';
      if (this.isChoiceCommentValid(lodashVal, this.subcheckForm.value) && this.isChoiceAttachmentValid(lodashVal, this.subcheckForm.value)) {
        return null;
      } else {
        return { state: 'INVALID' };
      }
    }
    return { state: 'INCOMPLETE' };
  }

  onChoiceAttachListChanged(event: IAttachment[]): void {
    this.subcheckForm.get('choice').patchValue({ choice_attachment: event });
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

  isChoiceCommentValid(lodashVal, newValue): boolean {
    return (
      lodash.get(this.yesNoSubcheckQuestion, lodashVal + 'comment.required', false) === false ||
      (lodash.get(this.yesNoSubcheckQuestion, lodashVal + 'comment.required', false) && lodash.get(newValue, 'choice.choice_comment.length', false) > 0)
    );
  }

  isChoiceAttachmentValid(lodashVal, newValue): boolean {
    return (
      lodash.get(this.yesNoSubcheckQuestion, lodashVal + 'attachment.required', false) === false ||
      (lodash.get(this.yesNoSubcheckQuestion, lodashVal + 'attachment.required', false) && lodash.get(newValue, 'choice.choice_attachment.length', false) > 0)
    );
  }
}
