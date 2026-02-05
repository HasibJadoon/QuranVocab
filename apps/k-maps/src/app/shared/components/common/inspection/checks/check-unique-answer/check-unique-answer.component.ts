import { Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ControlValueAccessor, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged, takeUntil, tap } from 'rxjs/operators';
import * as lodash from 'lodash';
import { ICheckQuestionWithChoices, ICheckResultUnique, ICheckResultUniqueChoice } from '../../inspection.model';
import { IAction, IAttachment } from '../../../models/attachments.model';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';

@TraceErrorClass()
@Component({
  selector: 'mcit-check-unique-answer',
  templateUrl: './check-unique-answer.component.html',
  styleUrls: ['./check-unique-answer.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitCheckUniqueAnswerComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => McitCheckUniqueAnswerComponent),
      multi: true
    }
  ]
})
export class McitCheckUniqueAnswerComponent implements OnInit, OnDestroy, ControlValueAccessor, Validators {
  @Input() environment;
  @Input() uniqueQuestion: ICheckQuestionWithChoices;
  @Input() defaultValue: ICheckResultUnique;
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
  attachmentShownId = '';
  commentShownId = '';

  private destroy$: Subject<boolean> = new Subject<boolean>();
  private initValue = true;
  private choiceStructureList: Array<ICheckResultUniqueChoice> = [];
  private previousId: string;

  constructor(private fb: UntypedFormBuilder) {}

  get choosedId() {
    return lodash.get(this.checkForm, 'value.choice.choice_id', undefined);
  }

  propagateChange: any = () => {};
  propagateTouch: any = () => {};

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  ngOnInit() {
    this.choiceStructureList = lodash.cloneDeep(this.buildChoicesStructureFromQuestion());
    this.checkForm = this.fb.group({
      choice: this.fb.group({
        choice_id: null,
        name: null,
        choice_comment: null,
        choice_attachment: null,
        choice_subcheck: this.fb.group({
          type: null,
          yes_no: null,
          unique_answer: null,
          multi_answers: null
        })
      })
    });

    this.checkForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      if (this.propagateChange && value.choice.choice_id) {
        if (this.previousId !== value.choice.choice_id) {
          const initValue = !this.previousId;
          this.previousId = lodash.clone(value.choice.choice_id);
          const choiceStructure = lodash.cloneDeep(this.choiceStructureList.find((choice) => choice.choice_id === value.choice.choice_id));
          if (choiceStructure) {
            this.attachmentShownId = this.attachmentShownId === value.choice.choice_id ? '' : this.attachmentShownId;
            this.commentShownId = this.commentShownId === value.choice.choice_id ? '' : this.commentShownId;
            this.checkForm.patchValue({ choice: initValue && value.choice.name ? value.choice : choiceStructure });
          }
        } else {
          this.propagateChange(value);
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
    const choice = lodash.get(this.checkForm, 'value.choice');
    if (choice && choice.choice_id && choice.name) {
      const index = this.uniqueQuestion.choices.findIndex((ch) => ch._id === choice.choice_id);
      return this.isSubcheckValid(choice) && this.isChoiceCommentValid(index, choice) && this.isChoiceAttachmentValid(index, choice) ? null : { state: 'INVALID' };
    }
    return { state: 'INCOMPLETE' };
  }

  buildChoicesStructureFromQuestion(): ICheckResultUniqueChoice[] {
    if (this.uniqueQuestion) {
      return this.uniqueQuestion.choices.map((c) => ({
        choice_id: c._id,
        name: c.choice,
        choice_comment: '',
        choice_attachment: [],
        choice_subcheck: {
          type: c.choice_subcheck && c.choice_subcheck.type ? c.choice_subcheck.type : null,
          yes_no: null,
          unique_answer: null,
          multi_answers: null
        }
      }));
    }
  }

  onChoiceAttachListChanged(event: IAttachment[]): void {
    this.checkForm.get('choice').patchValue({ choice_attachment: event });
  }

  onAttachAdded(event: IAttachment): void {
    this.attachAdded.emit(event);
  }

  showAttachment(currentId) {
    this.attachmentShownId = this.attachmentShownId === currentId ? '' : currentId;
  }

  showComment(currentId) {
    this.commentShownId = this.commentShownId === currentId ? '' : currentId;
  }

  isChoiceCommentValid(index: number, choice): boolean {
    return (
      lodash.get(this.uniqueQuestion, `choices.${index}.choice_comment.required`, false) === false ||
      (lodash.get(this.uniqueQuestion, `choices.${index}.choice_comment.required`, false) && lodash.get(choice, `choice_comment.length`, false) > 0)
    );
  }

  isChoiceAttachmentValid(index: number, choice): boolean {
    return (
      lodash.get(this.uniqueQuestion, `choices.${index}.choice_attachment.required`, false) === false ||
      (lodash.get(this.uniqueQuestion, `choices.${index}.choice_attachment.required`, false) && lodash.get(choice, `choice_attachment.length`, false) > 0)
    );
  }

  isSubcheckValid(choice): boolean {
    return lodash.get(choice, 'choice_subcheck.type', true) === null || this.isCurrentSubcheckPresent(choice);
  }

  isCurrentSubcheckPresent(choice) {
    const subcheckForm = this.checkForm.get(['choice', 'choice_subcheck', `${choice.choice_subcheck.type}`]);
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
    return choice.choice_subcheck?.type && choice.choice_subcheck[choice.choice_subcheck.type] !== null && subcheckValid;
  }

  doChangeCheckPath(checkPath: string) {
    this.checkPathChanged.emit(checkPath);
  }

  onCheckPathChanged(checkPath: string, childCheckPath: string): void {
    this.checkPathChanged.emit(checkPath + childCheckPath);
  }
}
