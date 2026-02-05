import { AfterViewInit, Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import * as lodash from 'lodash';
import { distinctUntilChanged, takeUntil, tap } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { ISubcheckQuestionWithChoices, ISubcheckResultUnique, ISubcheckResultUniqueChoice } from '../../../inspection.model';
import { IAction, IAttachment } from '../../../../models/attachments.model';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';

@TraceErrorClass()
@Component({
  selector: 'mcit-subcheck-unique-answer',
  templateUrl: './subcheck-unique-answer.component.html',
  styleUrls: ['./subcheck-unique-answer.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitSubcheckUniqueAnswerComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => McitSubcheckUniqueAnswerComponent),
      multi: true
    }
  ]
})
export class McitSubcheckUniqueAnswerComponent implements OnInit, OnDestroy, AfterViewInit, ControlValueAccessor, Validators {
  @Input() environment;
  @Input() defaultValue: ISubcheckResultUnique;
  @Input() uniqueSubcheckQuestion: ISubcheckQuestionWithChoices;
  @Input() isEditable$: Observable<boolean>;
  @Input() forceA4 = false;
  @Input() baseUrl: string;
  @Input() prefix_attach_url: string;
  @Input() suffix_attach_url: string;
  @Input() localMode = false;
  @Input() localAttachmentsDirectoryName: string;
  @Input() actions$: Observable<IAction[]> = null;

  @Output() attachAdded = new EventEmitter<IAttachment>();
  subcheckForm: UntypedFormGroup;
  attachmentShownId = '';
  commentShownId = '';

  private destroy$: Subject<boolean> = new Subject<boolean>();
  private initValue = true;
  private subChoiceStructureList: ISubcheckResultUniqueChoice[] = [];
  private previousId: string;

  constructor(private fb: UntypedFormBuilder) {}

  get choosedId() {
    return lodash.get(this.subcheckForm, 'value.choice.choice_id', undefined);
  }

  propagateChange: any = () => {};
  propagateTouch: any = () => {};

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  ngOnInit() {
    this.subChoiceStructureList = lodash.cloneDeep(this.buildChoicesStructureFromQuestion());
    this.subcheckForm = this.fb.group({
      choice: this.fb.group({
        choice_id: null,
        name: null,
        choice_attachment: null,
        choice_comment: null
      })
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
    this.subcheckForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value: ISubcheckResultUnique) => {
      if (this.propagateChange && value.choice.choice_id) {
        if (this.previousId !== value.choice.choice_id) {
          const initValue = !this.previousId;
          this.previousId = lodash.clone(value.choice.choice_id);
          const choiceStructure = lodash.cloneDeep(this.subChoiceStructureList.find((choice) => choice.choice_id === value.choice.choice_id));
          if (choiceStructure) {
            this.attachmentShownId = this.attachmentShownId === value.choice.choice_id ? '' : this.attachmentShownId;
            this.commentShownId = this.commentShownId === value.choice.choice_id ? '' : this.commentShownId;
            this.subcheckForm.patchValue({ choice: initValue && value.choice.name ? value.choice : choiceStructure });
          }
        } else {
          this.propagateChange(value);
        }
      }
    });
  }

  writeValue(value: ISubcheckResultUnique) {
    if (this.defaultValue && this.initValue) {
      this.subcheckForm.patchValue(this.defaultValue);
      this.initValue = false;
    }
    if (value) {
      this.subcheckForm.patchValue(value, { emitEvent: false });
    }
  }

  registerOnChange(fn: any) {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any) {
    this.propagateTouch = fn;
  }

  validate(c: UntypedFormControl) {
    const choice = lodash.get(this.subcheckForm, 'value.choice');
    if (choice && choice.choice_id && choice.name) {
      const index = this.uniqueSubcheckQuestion.choices.findIndex((ch) => ch._id === choice.choice_id);
      return this.isChoiceCommentValid(index, choice) && this.isChoiceAttachmentValid(index, choice) ? null : { state: 'INVALID' };
    }
    return { state: 'INCOMPLETE' };
  }

  buildChoicesStructureFromQuestion(): ISubcheckResultUniqueChoice[] {
    if (this.uniqueSubcheckQuestion) {
      return this.uniqueSubcheckQuestion.choices.map((c) => ({
        choice_id: c._id,
        name: c.choice,
        choice_comment: '',
        choice_attachment: []
      }));
    }
  }

  onChoiceAttachListChanged(event: IAttachment[]): void {
    this.subcheckForm.get('choice').patchValue({ choice_attachment: event });
  }

  onAttachAdded(event: IAttachment): void {
    this.attachAdded.emit(event);
  }

  showAttachment(isCurrent) {
    this.attachmentShownId = this.attachmentShownId === isCurrent ? '' : isCurrent;
  }

  showComment(isCurrent) {
    this.commentShownId = this.commentShownId === isCurrent ? '' : isCurrent;
  }

  isChoiceCommentValid(index: number, choice): boolean {
    return (
      lodash.get(this.uniqueSubcheckQuestion, `choices.${index}.choice_comment.required`, false) === false ||
      (lodash.get(this.uniqueSubcheckQuestion, `choices.${index}.choice_comment.required`, false) && lodash.get(choice, `choice_comment.length`, false) > 0)
    );
  }

  isChoiceAttachmentValid(index: number, choice): boolean {
    return (
      lodash.get(this.uniqueSubcheckQuestion, `choices.${index}.choice_attachment.required`, false) === false ||
      (lodash.get(this.uniqueSubcheckQuestion, `choices.${index}.choice_attachment.required`, false) && lodash.get(choice, `choice_attachment.length`, false) > 0)
    );
  }
}
