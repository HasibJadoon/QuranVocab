import { ViewportScroller } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Keyboard } from '@awesome-cordova-plugins/keyboard/ngx';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';
import { McitStorage } from '@lib-shared/common/storage/mcit-storage';
import * as lodash from 'lodash';
import { Observable, Subject, timer } from 'rxjs';
import { debounceTime, delay, distinctUntilChanged, filter, takeUntil, tap } from 'rxjs/operators';
import { McitMeaningPipe } from '../../common/pipes/meaning.pipe';
import { CloseActionService } from '../../layouts/close-action-layout/close-action.service';
import { IAction, IAttachment } from '../../models/attachments.model';
import { McitQuestionDiscardModalService } from '../../question-discard-modal/question-discard-modal.service';
import { McitQuestionDiscardParamsEnum } from '../../question-discard-modal/question-discard.model';
import { IVehicleCheckQuestion, IVehicleInspectionCheckResult } from '../inspection.model';

@TraceErrorClass()
@Component({
  selector: 'mcit-checks',
  templateUrl: './checks.component.html',
  styleUrls: ['./checks.component.scss'],
  providers: [McitMeaningPipe]
})
export class McitChecksComponent implements OnInit, OnDestroy {
  @Input() environment;
  @Input() inspection: any;
  @Input() questions: IVehicleCheckQuestion[];
  @Input() responses: IVehicleInspectionCheckResult[];
  @Input() prefix_attach_url: string;
  @Input() suffix_attach_url: string;
  @Input() step: 'pickup' | 'delivery';
  @Input() isEditable$: Observable<boolean>;
  @Input() forceA4 = false;
  @Input() baseUrl: string;
  @Input() localMode = false;
  @Input() localAttachmentsDirectoryName: string;
  @Input() actions$: Observable<IAction[]> = null;

  @Output() saveClicked = new EventEmitter<IVehicleInspectionCheckResult[]>();
  @Output() attachAdded = new EventEmitter<IAttachment>();
  @Output() checksChanged = new EventEmitter<{ [key: string]: IVehicleInspectionCheckResult }>();

  public resumeGroupKey: number;
  public groupedChecksQuestions: any;
  public inspectionForm: UntypedFormGroup;
  public groupProgress = [];
  public initGroupProgress = [];
  private destroy$: Subject<boolean> = new Subject<boolean>();

  private checkPath: string;
  private checkId: string;

  constructor(
    private fb: UntypedFormBuilder,
    private questionDiscardModalService: McitQuestionDiscardModalService,
    private closeActionService: CloseActionService,
    private mcitMeaningPipe: McitMeaningPipe,
    private keyboard: Keyboard,
    private storage: McitStorage,
    private viewportScroller: ViewportScroller
  ) {}

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  ngOnInit() {
    this.isEditable$
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(),
        tap((editable) => {
          if (this.environment?.cordova) {
            this.keyboard
              ?.onKeyboardShow()
              .pipe(takeUntil(this.destroy$))
              .subscribe((res) => {
                setTimeout(() => document?.activeElement?.scrollIntoView({ block: 'center', behavior: 'auto' }), 100);
              });
          }
        })
      )
      .subscribe();

    let questions;
    let responses;
    if (this.inspection) {
      questions = this.inspection?.questions?.[this.step]?.checks ?? [];
      responses = this.inspection?.responses?.[this.step]?.checks ?? null;
    } else {
      questions = this.questions ?? [];
      responses = this.responses ?? null;
    }
    this.inspectionForm = this.fb.group(this.buildChecksControls(questions, responses));
    this.closeActionService
      .closeAction$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.doSave(true));
    this.inspectionForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        filter(() => !!this.groupedChecksQuestions?.length),
        tap((value) => {
          this.groupProgress = this.updateProgressBar(this.groupedChecksQuestions, this.inspectionForm);
        }),
        debounceTime(1000),
        tap(() => this.checksChanged.emit())
      )
      .subscribe();
    timer(0)
      .pipe(
        tap(() => {
          this.inspectionForm.updateValueAndValidity();
          this.groupedChecksQuestions = lodash
            .chain(questions)
            .groupBy((x) => this.mcitMeaningPipe.transform(x.group_name))
            .value();
          this.groupedChecksQuestions = Object.keys(this.groupedChecksQuestions).map((key) => this.groupedChecksQuestions[key]);
        }),
        delay(1000),
        tap(() => {
          this.groupProgress = this.updateProgressBar(this.groupedChecksQuestions, this.inspectionForm);
          this.initGroupProgress = lodash.clone(this.groupProgress);
        })
      )
      .subscribe();
  }

  buildChecksControls(checksQuestionsList: IVehicleCheckQuestion[], checksResultsList: IVehicleInspectionCheckResult[]) {
    const controlsInspectionConfig = {};
    checksQuestionsList.forEach((checkQuestion) => {
      controlsInspectionConfig[checkQuestion._id] = this.fb.group({
        check_id: checkQuestion._id,
        type: checkQuestion.type,
        [checkQuestion.type]: [this.findCheckResult(checkQuestion._id, checksResultsList), Validators.required]
      });
    });
    return controlsInspectionConfig;
  }

  findCheckResult(checkQuestionId: string, checksResultsList: IVehicleInspectionCheckResult[]): any {
    const result = checksResultsList ? checksResultsList.find((result2) => result2.check_id === checkQuestionId) : null;
    return result ? result[result.type] : null;
  }

  updateProgressBar(groupedChecksQuestions: IVehicleCheckQuestion[][], inspectionForm: UntypedFormGroup): Array<any> {
    return groupedChecksQuestions.map((group: IVehicleCheckQuestion[]) => {
      const states = group.reduce<{ valid: number; invalid: number; incomplete: number }>(
        (acc, cur) => {
          if (cur._id) {
            const questionForm = inspectionForm.get(cur._id);
            const errorType: 'INVALID' | 'INCOMPLETE' | null = questionForm.get(cur.type).getError('state');
            switch (errorType) {
              case 'INCOMPLETE':
                acc.incomplete++;
                break;
              case 'INVALID':
                acc.invalid++;
                break;
              case null:
                acc.valid++;
                break;
              default:
                break;
            }
          } else {
            acc.invalid++;
          }
          return acc;
        },
        {
          valid: 0,
          invalid: 0,
          incomplete: 0
        }
      );
      return !(states.invalid || states.incomplete) ? 2 : states.invalid || states.valid ? 1 : 0;
    });
  }

  doSave(close = false) {
    const checksKeys = Object.keys(this.inspectionForm.value);
    const checksValid = checksKeys.filter((check) => this.inspectionForm.get(check).valid);
    const checksToSave = checksKeys.map((check) => ({
      ...this.inspectionForm.value[check],
      is_valid: this.inspectionForm.get(check).valid
    }));
    if (checksValid.length !== checksKeys.length || close) {
      this.questionDiscardModalService
        .showQuestion('INSPECTIONS.CHECKS.QUESTION_TITLE_CHECKS_BACK', 'INSPECTIONS.CHECKS.QUESTION_SAVE_CHECKS_PROGRESS', 'COMMON.SAVE', 'INSPECTIONS.CHECKS.CLOSE_WITHOUT_SAVING', 'COMMON.CANCEL', true, {
          questionParams: { num: checksValid.length, total: checksKeys.length }
        })
        .subscribe((modalAnswer: string) => {
          if (modalAnswer === McitQuestionDiscardParamsEnum.save) {
            this.saveClicked.emit(checksToSave);
          } else if (modalAnswer === McitQuestionDiscardParamsEnum.discard) {
            this.saveClicked.emit([]);
          }
        });
    } else {
      this.saveClicked.emit(checksToSave);
    }
  }

  onAttachAdded(attach: IAttachment): void {
    this.attachAdded.emit(attach);
  }

  extractState(): any {
    return {
      // questions: this.questions,
      responses: this.responses,
      // prefix_attach_url: this.prefix_attach_url,
      // suffix_attach_url: this.suffix_attach_url,
      // step: this.step,
      // isEditable: this.isEditable,
      // forceA4: this.forceA4,
      // baseUrl: this.baseUrl,
      // localMode: this.localMode,
      // localAttachmentsDirectoryName: this.localAttachmentsDirectoryName,
      checkPath: this.checkPath,
      groupKey: this.findIndexFromCheckId(),
      checkId: this.checkId,
      // initGroupProgress: this.initGroupProgress,
      groupProgress: this.groupProgress,
      checksToSave: this.inspectionForm.value,
      // groupedChecksQuestions: this.groupedChecksQuestions,

      scrollPosition: this.viewportScroller.getScrollPosition()
    };
  }

  restoreState(state: any): void {
    if (state) {
      // this.questions = state.questions;
      this.responses = state.responses;
      // this.prefix_attach_url = state.prefix_attach_url;
      // this.suffix_attach_url = state.suffix_attach_url;
      // this.step = state.step;
      // this.isEditable = state.isEditable;
      // this.forceA4 = state.forceA4;
      // this.baseUrl = state.baseUrl;
      // this.localMode = state.localMode;
      // this.localAttachmentsDirectoryName = state.localAttachmentsDirectoryName;
      this.checkPath = state.checkPath;
      this.resumeGroupKey = state.groupKey;
      this.checkId = state.checkId;
      // this.initGroupProgress = state.initGroupProgress;
      this.groupProgress = state.groupProgress;
      this.inspectionForm.setValue(state.checksToSave);
      this.inspectionForm.setValue(state.checksToSave); // The 2nd time is needed because the 1st one will empty unique answer checks...
      // this.groupedChecksQuestions = state.groupedChecksQuestions;
      // this.groupProgress = this.updateProgressBar(this.groupedChecksQuestions, this.inspectionForm);

      this.viewportScroller.scrollToPosition(state.scrollPosition);
    }
  }

  doChangeCheckPath(anchor: string, checkPath: string): void {
    this.checkId = anchor;
    this.checkPath = checkPath;
  }

  onCheckPathChanged(anchor: string, checkPath: string, childCheckPath: string) {
    this.checkId = anchor;
    this.checkPath = checkPath + childCheckPath;
  }

  findIndexFromCheckId(): number {
    return this.groupedChecksQuestions.findIndex((group: IVehicleCheckQuestion[]) => group.find((checkQuestion) => checkQuestion?._id === this.checkId));
  }
}
