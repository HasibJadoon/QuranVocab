import { Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';
import * as lodash from 'lodash';
import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged, takeUntil, tap } from 'rxjs/operators';
import { IAction, IAttachment } from '../../../models/attachments.model';
import { IDocumentLink } from '../../../models/types.model';
import { ICheckQuestionWithChoices, ICheckResultMulti, ICheckResultMultiChoice, IVehicleSubcheckQuestion } from '../../inspection.model';

@TraceErrorClass()
@Component({
  selector: 'mcit-check-multi-answers',
  templateUrl: './check-multi-answers.component.html',
  styleUrls: ['./check-multi-answers.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitCheckMultiAnswersComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => McitCheckMultiAnswersComponent),
      multi: true
    }
  ]
})
export class McitCheckMultiAnswersComponent implements OnInit, OnDestroy {
  @Input() environment;
  @Input() defaultValue: ICheckResultMulti;
  @Input() multiQuestion: ICheckQuestionWithChoices;
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
  isShownAttachment = [];
  isShownComment = [];
  subcheckQuestion: IVehicleSubcheckQuestion;

  private destroy$: Subject<boolean> = new Subject<boolean>();
  private initValue = true;
  private choiceAttachments: Array<Array<IDocumentLink>> = [];
  private choiceComments: Array<string> = [];
  private multiChoicesStructure: ICheckResultMultiChoice[] = [];
  private previousCheckboxs: boolean[] = [];

  constructor(private fb: UntypedFormBuilder) {}

  get choicesControl(): UntypedFormArray {
    return this.checkForm.get('choices') as UntypedFormArray;
  }

  propagateChange: any = () => {};
  propagateTouch: any = () => {};

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  ngOnInit() {
    this.choiceAttachments = this.multiQuestion.choices.map(() => []);
    this.multiChoicesStructure = lodash.cloneDeep(this.buildChoicesStructure());

    this.checkForm = this.fb.group({ choices: this.buildChoicesForm() });
    this.checkForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
      )
      .subscribe((newValue: ICheckResultMulti) => {
        if (this.propagateChange) {
          newValue.choices = newValue.choices.map((choice, i) => {
            if (this.previousCheckboxs[i] === choice.checkbox) {
              return choice;
            } else {
              this.previousCheckboxs[i] = choice.checkbox;
              if (choice.checkbox) {
                return choice;
              } else {
                this.isShownAttachment[i] = false;
                this.isShownComment[i] = false;
                return lodash.cloneDeep(this.multiChoicesStructure.find((mChoice) => mChoice.choice_id === choice.choice_id));
              }
            }
          });

          this.checkForm.patchValue(newValue);
          // On propage seulement les choices valid
          const propagateValue = {
            ...newValue,
            choices: newValue?.choices?.map((choice, i) => (this.isChoiceCheckedAndValid(choice) ? choice : lodash.cloneDeep(this.multiChoicesStructure.find((mChoice) => mChoice.choice_id === choice.choice_id))))
          };
          this.propagateChange(propagateValue.choices.some((ch) => ch.checkbox) ? propagateValue : null);
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

  buildChoicesStructure(): ICheckResultMultiChoice[] {
    return this.multiQuestion.choices.map((_current, i) => ({
      choice_id: this.multiQuestion.choices[i]._id,
      checkbox: false,
      name: this.multiQuestion.choices[i].choice,
      choice_attachment: null,
      choice_comment: null,
      choice_subcheck: this.multiQuestion.choices[i].choice_subcheck
        ? {
            type: this.multiQuestion.choices[i].choice_subcheck.type,
            yes_no: null,
            unique_answer: null,
            multi_answers: null
          }
        : null
    }));
  }

  buildChoicesForm(): UntypedFormArray {
    return this.fb.array(
      this.multiChoicesStructure.map((current) =>
        this.fb.group({
          ...current,
          choice_subcheck: this.handleSubcheckGroup(current.choice_id)
        })
      )
    );
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.propagateTouch = fn;
  }

  writeValue(value: ICheckResultMulti): void {
    if (this.defaultValue && this.initValue) {
      this.updateStoredChoices(this.defaultValue);
      this.checkForm.patchValue(this.defaultValue);
      this.initValue = false;
    }
    if (value) {
      this.updateStoredChoices(value);
      this.checkForm.patchValue(value);
    }
  }

  validate(c: UntypedFormControl) {
    const val = this.checkForm.value;
    const checkedChoices = val.choices.filter((choice) => choice.checkbox === true);
    if (checkedChoices.length > 0) {
      return checkedChoices.map((choice) => this.isChoiceCheckedAndValid(choice)).reduce((curr, next) => curr || next) ? null : { state: 'INVALID' };
    } else {
      return { state: 'INCOMPLETE' };
    }
  }

  updateStoredChoices(value: ICheckResultMulti): void {
    value?.choices?.forEach((choice: ICheckResultMultiChoice, index) => {
      if (choice?.choice_attachment?.length > 0) {
        this.choiceAttachments[index] = choice.choice_attachment;
      }
      if (choice?.choice_comment?.length > 0) {
        this.choiceComments[index] = choice.choice_comment;
      }
    });
  }

  isCurrentSubcheckPresent(choice: ICheckResultMultiChoice, checkForm: UntypedFormGroup): boolean {
    const index = checkForm.value.choices.findIndex((current) => current.choice_id === choice.choice_id);
    if (index >= 0) {
      const subcheckForm = this.checkForm.get(['choices', `${index}`, 'choice_subcheck']);
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
    return false;
  }

  handleSubcheckGroup(newChoiceId): UntypedFormGroup {
    const choiceQuestion = newChoiceId ? this.multiQuestion.choices.find((c) => c._id === newChoiceId) : null;
    if (choiceQuestion && choiceQuestion.choice_subcheck) {
      this.subcheckQuestion = choiceQuestion.choice_subcheck;
      return this.fb.group({
        type: choiceQuestion.choice_subcheck.type,
        [choiceQuestion.choice_subcheck.type]: null
      });
    }
    return null;
  }

  onAttachAdded(event: IAttachment): void {
    this.attachAdded.emit(event);
  }

  onChoiceAttachListChanged(event: IAttachment[], index: number): void {
    this.checkForm.get(['choices', `${index}`]).patchValue({ choice_attachment: event });
  }

  showAttachment(index: number): void {
    this.isShownAttachment[index] = !this.isShownAttachment[index];
  }

  showComment(index: number): void {
    this.isShownComment[index] = !this.isShownComment[index];
  }

  isChoiceCommentValid(responseChoice: ICheckResultMultiChoice): boolean {
    const question = this.multiQuestion.choices.find((questionChoice) => questionChoice._id === responseChoice?.choice_id);
    return (question?.choice_comment?.required ?? false) === false || (question?.choice_comment?.required && !!responseChoice?.choice_comment?.length);
  }

  isChoiceAttachmentValid(responseChoice: ICheckResultMultiChoice): boolean {
    const question = this.multiQuestion.choices.find((questionChoice) => questionChoice._id === responseChoice?.choice_id);
    return (question?.choice_attachment?.required ?? false) === false || (question?.choice_attachment?.required && !!responseChoice?.choice_attachment?.length);
  }

  isChoiceCheckedAndValid(choice: ICheckResultMultiChoice): boolean {
    return choice.checkbox && this.isChoiceCommentValid(choice) && this.isChoiceAttachmentValid(choice) && (choice.choice_subcheck === null || this.isCurrentSubcheckPresent(choice, this.checkForm));
  }

  onCheckPathChanged(checkPath: string, childCheckPath: string): void {
    this.checkPathChanged.emit(checkPath + childCheckPath);
  }

  doChangeCheckPath(checkPath: string): void {
    this.checkPathChanged.emit(checkPath);
  }
}
