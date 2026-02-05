import { AfterViewInit, Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';
import * as lodash from 'lodash';
import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged, takeUntil, tap } from 'rxjs/operators';
import { IAction, IAttachment } from '../../../../models/attachments.model';
import { IDocumentLink } from '../../../../models/types.model';
import { ICheckResultMultiChoice, ISubcheckQuestionWithChoices, ISubcheckResultMulti, ISubcheckResultMultiChoice } from '../../../inspection.model';

@TraceErrorClass()
@Component({
  selector: 'mcit-subcheck-multi-answers',
  templateUrl: './subcheck-multi-answers.component.html',
  styleUrls: ['./subcheck-multi-answers.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitSubcheckMultiAnswersComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => McitSubcheckMultiAnswersComponent),
      multi: true
    }
  ]
})
export class McitSubcheckMultiAnswersComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() environment;
  @Input() defaultValue: ISubcheckResultMulti;
  @Input() multiSubcheckQuestion: ISubcheckQuestionWithChoices;
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

  public subcheckForm: UntypedFormGroup;
  public isShownAttachment = [];
  public isShownComment = [];
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private initValue = true;
  private choiceAttachments: Array<Array<IDocumentLink>> = [];
  private choiceComments: Array<string> = [];
  private multiSubcheckStructure: ISubcheckResultMultiChoice[];
  private previousCheckboxs: boolean[] = [];

  constructor(private fb: UntypedFormBuilder) {}

  get choicesControl(): UntypedFormArray {
    return this.subcheckForm.get(['choices']) as UntypedFormArray;
  }

  propagateChange: any = () => {};
  propagateTouch: any = () => {};

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  ngOnInit() {
    this.choiceAttachments = this.multiSubcheckQuestion.choices.map(() => []);
    this.multiSubcheckStructure = lodash.cloneDeep(this.buildChoicesStructure());
    this.subcheckForm = this.fb.group({ choices: this.buildChoicesForm() });

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
    this.subcheckForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
      )
      .subscribe((newValue: ISubcheckResultMulti) => {
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
                return lodash.cloneDeep(this.multiSubcheckStructure.find((mChoice) => mChoice.choice_id === choice.choice_id));
              }
            }
          });

          this.subcheckForm.patchValue(newValue);
          // On propage seulement les choices valid
          const propagateValue = {
            ...newValue,
            choices: newValue?.choices?.map((choice, i) => (this.isChoiceCheckedAndValid(choice) ? choice : lodash.cloneDeep(this.multiSubcheckStructure.find((mChoice) => mChoice.choice_id === choice.choice_id))))
          };
          this.propagateChange(propagateValue.choices.some((ch) => ch.checkbox) ? propagateValue : null);
        }
      });
  }

  buildChoicesStructure(): ISubcheckResultMultiChoice[] {
    return this.multiSubcheckQuestion.choices.map((_current, i) => ({
      choice_id: this.multiSubcheckQuestion.choices[i]._id,
      checkbox: false,
      name: this.multiSubcheckQuestion.choices[i].choice,
      choice_comment: null,
      choice_attachment: null
    }));
  }

  buildChoicesForm(): UntypedFormArray {
    return this.fb.array(this.multiSubcheckStructure.map((current) => this.fb.group(current)));
  }

  writeValue(value: ISubcheckResultMulti) {
    if (this.defaultValue && this.initValue) {
      this.updateStoredChoices(this.defaultValue);
      this.subcheckForm.patchValue(this.defaultValue);
      this.initValue = false;
    }
    if (value) {
      this.updateStoredChoices(value);
      this.subcheckForm.patchValue(value, { emitEvent: false });
    }
  }

  updateStoredChoices(value: ISubcheckResultMulti) {
    value?.choices?.forEach((choice: ISubcheckResultMultiChoice, index) => {
      if (choice?.choice_attachment?.length > 0) {
        this.choiceAttachments[index] = choice.choice_attachment;
      }
      if (choice?.choice_comment?.length > 0) {
        this.choiceComments[index] = choice.choice_comment;
      }
    });
  }

  registerOnChange(fn: any) {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any) {
    this.propagateTouch = fn;
  }

  validate(c: UntypedFormControl) {
    const val = this.subcheckForm.value;
    const checkedChoices = val.choices.filter((choice) => choice.checkbox === true);
    if (checkedChoices.length > 0) {
      return checkedChoices.map((choice) => this.isChoiceCheckedAndValid(choice)).reduce((curr, next) => curr || next) ? null : { state: 'INVALID' };
    } else {
      return { state: 'INCOMPLETE' };
    }
  }

  onChoiceAttachListChanged(event: IAttachment[], index: number): void {
    this.subcheckForm.get(['choices', `${index}`]).patchValue({ choice_attachment: event });
  }

  onAttachAdded(event: IAttachment): void {
    this.attachAdded.emit(event);
  }

  showAttachment(index: number) {
    this.isShownAttachment[index] = !this.isShownAttachment[index];
  }

  showComment(index: number) {
    this.isShownComment[index] = !this.isShownComment[index];
  }

  isChoiceCommentValid(responseChoice: ICheckResultMultiChoice): boolean {
    const question = this.multiSubcheckQuestion.choices.find((questionChoice) => questionChoice._id === responseChoice?.choice_id);
    return (question?.choice_comment?.required ?? false) === false || (question?.choice_comment?.required && !!responseChoice?.choice_comment?.length);
  }

  isChoiceAttachmentValid(responseChoice: ICheckResultMultiChoice): boolean {
    const question = this.multiSubcheckQuestion.choices.find((questionChoice) => questionChoice._id === responseChoice?.choice_id);
    return (question?.choice_attachment?.required ?? false) === false || (question?.choice_attachment?.required && !!responseChoice?.choice_attachment?.length);
  }

  isChoiceCheckedAndValid(choice: ICheckResultMultiChoice): boolean {
    return choice.checkbox && this.isChoiceCommentValid(choice) && this.isChoiceAttachmentValid(choice);
  }

  onCheckPathChanged(checkPath: string): void {
    this.checkPathChanged.emit(checkPath);
  }
}
