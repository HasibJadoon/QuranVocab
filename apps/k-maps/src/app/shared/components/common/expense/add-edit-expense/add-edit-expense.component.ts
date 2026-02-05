import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit, Inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import * as lodash from 'lodash';

import { McitImageViewerOverlayService } from '@lib-shared/common/image-viewer-overlay/image-viewer-overlay.service';
import { McitQuestionModalService } from '@lib-shared/common/question-modal/question-modal.service';
import { McitPopupService } from '@lib-shared/common/services/popup.service';
import { McitWaitingService } from '@lib-shared/common/services/waiting.service';
import { McitMenuDropdownService } from '@lib-shared/common/menu-dropdown/menu-dropdown.service';
import { MCIT_DIALOG_DATA } from '@lib-shared/common/dialog/dialog.service';
import { McitDialogRef } from '@lib-shared/common/dialog/dialog-ref';
import { FileService } from 'projects/dispatcher/src/app/business/carrier/services/file.service';
import { IExpense } from '@lib-shared/common/models/expense.model';
import { ExpenseHttpService } from '@lib-shared/common/expense/expense.service';
import { IDocumentLink } from '@lib-shared/common/models/types.model';
import { McitCoreConfig, McitCoreEnv } from '@lib-shared/common/helpers/provider.helper';
import { DispatcherApiRoutesEnum } from '@lib-shared/common/contract/dispatcher-api-routes.domain';
import { ExpenseStatus } from '@lib-shared/common/models/domains/expense-status.domain';
import { EXPENSES_TYPES_GROUPS } from '@lib-shared/common/expense/domain/type-expenses.domain';
import { UserControllerService } from 'projects/dispatcher/src/app/business/services/user-controller.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { McitInfoModalService } from '@lib-shared/common/info-modal/info-modal.service';
import { McitInvoicedLockPipe } from '@lib-shared/common/common/pipes/to-lock.pipe';

@Component({
  selector: 'mcit-add-edit-expense',
  templateUrl: './add-edit-expense.component.html',
  styleUrls: ['./add-edit-expense.component.scss'],
  animations: [
    trigger('picture-anim', [transition(':leave', [style({ opacity: 1, transform: 'scale(1,1)' }), animate('.4s ease', style({ opacity: 0, transform: 'scale(0,0)' }))])]),
    trigger('pictures-anim', [transition('* => *', [query(':enter', [style({ opacity: 0, transform: 'scale(0,0)' }), stagger(100, [animate('.4s ease', style({ opacity: 1, transform: 'scale(1,1)' }))])], { optional: true })])])
  ],
  providers: [McitInvoicedLockPipe]
})
export class McitAddEditExpenseComponent implements OnInit, OnDestroy {
  public expenseContext: Pick<IExpense, 'owner_id' | 'attached_object' | 'resources'>;
  public object_no: string;
  public apiRoute: DispatcherApiRoutesEnum;
  public isEditForm: boolean;
  public expenseForm: UntypedFormGroup;
  public submitAttempt = false;
  public expense: IExpense;
  public attachmentsToAdd: string[] = [];
  public attachmentsToDelete: string[] = [];
  public idOrder: string;

  public smallWindow = false;

  public expensesAttachmentsLoad: boolean[];
  public expensesAttachmentsUrls: string[];

  public gridCols: number;
  public upload = false;
  public openingFile = false;
  public deletePhotoMap: Map<string, any> = new Map<string, any>();
  public deleteFileMap: Map<string, any> = new Map<string, any>();

  public currencyOptions: { value: string; name: string }[] = [
    { value: 'EUR', name: 'EUR' },
    { value: 'GBP', name: 'GBP' }
  ];

  public expensesTypesGroupsOptions = EXPENSES_TYPES_GROUPS;

  public expensesGroupsTranslation = {
    client: 'customer',
    opérationnel: 'operational'
  };

  ExpenseStatus = ExpenseStatus;
  formDisabled = false;
  hasAfterAccountingEditionRight = false;

  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private formBuilder: UntypedFormBuilder,
    private expenseHttpService: ExpenseHttpService,
    private popupService: McitPopupService,
    private waitingService: McitWaitingService,
    private breakpointObserver: BreakpointObserver,
    private imageViewerModalService: McitImageViewerOverlayService,
    private questionModalService: McitQuestionModalService,
    private changeDetectorRef: ChangeDetectorRef,
    private fileService: FileService,
    private menuDropdownService: McitMenuDropdownService,
    private dialogRef: McitDialogRef<McitAddEditExpenseComponent>,
    private config: McitCoreConfig,
    private environment: McitCoreEnv,
    private userControllerService: UserControllerService,
    private toLockPipe: McitInvoicedLockPipe,
    private infoModalService: McitInfoModalService,
    @Inject(MCIT_DIALOG_DATA)
    data: {
      expense_id?: string;
      expenseContext?: Pick<IExpense, 'owner_id' | 'attached_object' | 'resources'> | IExpense;
      formDisabled?: boolean;
    }
  ) {
    if (data.expense_id) {
      this.waitingService.showWaiting();
      this.isEditForm = true;
      this.expenseHttpService.getExpenseById(data.expense_id).subscribe(
        (expense: IExpense) => {
          this.initExpenseForm(expense);
          this.waitingService.hideWaiting();
          this.formDisabled = this.toLockPipe.transform(this.expense) ?? false;
        },
        (err: Error) => {
          this.waitingService.hideWaiting();
          this.popupService.showError();
        }
      );
    } else {
      this.isEditForm = false;
      this.expenseContext = data.expenseContext;
      this.setObjectNo(data.expenseContext);
    }
    this.expenseForm = this.formBuilder.group({
      type_of_expense: this.formBuilder.group({
        group: ['', Validators.compose([Validators.minLength(1), Validators.required])],
        type: ['', Validators.compose([Validators.minLength(1), Validators.required])]
      }),
      amount: [Validators.compose([Validators.minLength(1), Validators.pattern(/^[0-9]+[.,]?[0-9]{0,2}$/), Validators.required])],
      currency: [this.currencyOptions[0].value, Validators.compose([Validators.minLength(1), Validators.required])],
      description: ['', Validators.compose([Validators.minLength(0)])]
    });
  }

  ngOnInit(): void {
    this.updateGrids();

    this.userControllerService
      .user$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.hasAfterAccountingEditionRight = (user?.apps?.dispatcher?.roles || []).includes('accounting_update_main_object');
      });
  }

  doClose(expense?: IExpense) {
    this.dialogRef.close(expense);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
    if (this.attachmentsToAdd.length > 0) {
      this.attachmentsToAdd.forEach((attachment) => {
        this.expenseHttpService.deleteExpenseAttachment(attachment).subscribe();
      });
    }
  }

  doUnlockEdition() {
    if (this.hasAfterAccountingEditionRight) {
      this.questionModalService.showQuestion('EXPENSES.ADD_EDIT_MODAL.UNLOCK_PROMPT.TITLE', 'EXPENSES.ADD_EDIT_MODAL.UNLOCK_PROMPT.MESSAGE', 'EXPENSES.ADD_EDIT_MODAL.UNLOCK_PROMPT.CONFIRM', 'COMMON.CANCEL', true).subscribe((next) => {
        if (next) {
          this.formDisabled = false;
        }
      });
    } else {
      this.infoModalService.showInfo('EXPENSES.ADD_EDIT_MODAL.RIGHTS.TITLE', 'EXPENSES.ADD_EDIT_MODAL.RIGHTS.MESSAGE');
    }
  }

  private updateGrids(): void {
    if (this.breakpointObserver.isMatched('(max-width: 768px)')) {
      this.smallWindow = true;
      this.gridCols = 2;
    } else {
      this.smallWindow = false;
      this.gridCols = 5;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.updateGrids();
    this.changeDetectorRef.detectChanges();
  }

  private updatePictures(): void {
    this.expensesAttachmentsLoad = [];
    this.expensesAttachmentsUrls = lodash.get(this.expense, 'attachments', []).map((attachment: IDocumentLink) => {
      this.expensesAttachmentsLoad.push(false);
      return `${this.environment.apiUrl}/v2/${this.config.app}/expenses/attachments/${attachment.document_id}?preview=true`;
    });
  }

  async doSave(): Promise<void> {
    this.submitAttempt = true;
    if (!this.expenseForm.valid) {
      return;
    }

    if (this.attachmentsToDelete.length > 0) {
      this.attachmentsToDelete.forEach((attachmentId) => {
        this.expenseHttpService.deleteExpenseAttachment(attachmentId).subscribe();
      });
    }

    this.attachmentsToAdd = [];
    if (this.isEditForm) {
      this.update();
    } else {
      this.create();
    }
  }

  private update(): void {
    this.waitingService.showWaiting();

    this.expenseHttpService.updateExpense({ _id: this.expense._id, ...this.expense, ...this.expenseForm.getRawValue() }).subscribe(
      (updatedExpense: IExpense) => {
        this.popupService.showSuccess('EXPENSES.ADD_EDIT_MODAL.EDIT_SUCCESS');
        this.waitingService.hideWaiting();
        this.doClose(updatedExpense);
      },
      (err: any) => {
        this.waitingService.hideWaiting();
        this.popupService.showError();
      }
    );
  }

  private create(): void {
    this.waitingService.showWaiting();
    const expense = { ...this.expenseContext, ...this.expenseForm.getRawValue(), attachment: this.attachmentsToAdd };
    this.expenseHttpService.addExpense(expense).subscribe(
      (createdExpense: IExpense) => {
        this.waitingService.hideWaiting();
        this.popupService.showSuccess('EXPENSES.ADD_EDIT_MODAL.ADD_SUCCESS');
        this.initExpenseForm(createdExpense);
      },
      (err: any) => {
        this.waitingService.hideWaiting();
        this.popupService.showError();
      }
    );
  }

  public onExpensesAttachmentsLoad(index: number): void {
    this.expensesAttachmentsLoad[index] = true;
    this.changeDetectorRef.detectChanges();
  }

  public doShowExpensesAttachments(index: number): void {
    this.imageViewerModalService.open({
      urls: this.expensesAttachmentsUrls,
      current: index
    });
  }

  public doAddExpensesAttachments(event: Event | any, expense: IExpense): void {
    if (event.target.files && event.target.files[0]) {
      const file: File = event.target.files[0];
      this.upload = true;
      this.changeDetectorRef.detectChanges();
      this.waitingService.showWaiting();
      const formData = new FormData();
      formData.append('file', file, file.name);
      this.expenseHttpService.addExpenseAttachment(expense._id, formData).subscribe(
        (uploadedAttactement: IDocumentLink) => {
          if (!this.expense.attachments) {
            this.expense.attachments = [];
            this.expensesAttachmentsLoad = [];
            this.expensesAttachmentsUrls = [];
          }
          this.attachmentsToAdd.push(uploadedAttactement.document_id);
          this.expense.attachments.push(uploadedAttactement);
          this.expensesAttachmentsLoad.push(false);
          this.expensesAttachmentsUrls.push(`${this.environment.apiUrl}/v2/${this.config.app}/expenses/attachments/${uploadedAttactement.document_id}?preview=true`);

          this.upload = false;
          this.waitingService.hideWaiting();
          this.changeDetectorRef.detectChanges();
        },
        (error: Error) => {
          this.waitingService.hideWaiting();
          this.upload = false;
          this.popupService.showError();
          this.changeDetectorRef.detectChanges();
        }
      );
    } else {
      this.popupService.showError('CARRIER_RTO_INFO.NOT_JPEG');
    }
  }

  private isImageFile(name: string): boolean {
    if (name == null || name.indexOf('.') === -1) {
      return true;
    }
    const jpeg = name.toString().toLowerCase().endsWith('jpeg');
    const jpg = name.toString().toLowerCase().endsWith('jpg');
    const png = name.toString().toLowerCase().endsWith('png');

    return !!(jpeg || jpg || png);
  }

  public doDeleteAttachment(documentId: string, index: number): void {
    this.attachmentsToDelete.push(documentId);
    this.expensesAttachmentsLoad.splice(index, 1);
    this.expensesAttachmentsUrls.splice(index, 1);
    this.expense.attachments.splice(index, 1);
    this.changeDetectorRef.detectChanges();
  }

  public doDownloadExpensesFile(expense: IExpense, file: IDocumentLink): void {
    this.questionModalService
      .showQuestion('EXPENSES.ADD_EDIT_MODAL.TITLE_DOWNLOAD_FILE', 'EXPENSES.ADD_EDIT_MODAL.QUESTION_DOWNLOAD_FILE', 'COMMON.VALIDATE', 'COMMON.CANCEL', false, {
        questionParams: {
          filename: file.name
        }
      })
      .subscribe((response: boolean) => {
        if (response) {
          this.openingFile = true;
          this.expenseHttpService.getExpenseAttachment(expense._id, file.document_id).subscribe(
            (data: ArrayBuffer) => {
              const blob = new Blob([data]);
              this.fileService.openFileMultiPlatforms(blob, file.name);
              this.openingFile = false;
            },
            (err) => {
              this.popupService.showError();
              this.changeDetectorRef.detectChanges();
              this.openingFile = false;
            }
          );
        }
      });
  }

  public trackByFn(index: number, item: IDocumentLink) {
    return item.document_id;
  }

  public doChangeExpensesGroup(event: Event | any) {
    const expenseGroup: string = event.target.options[Number(event.target.selectedIndex)].parentNode.getAttribute('label');
    const translatedExpenseGroup: string = this.expensesGroupsTranslation?.[expenseGroup.toLowerCase()] || expenseGroup.toLowerCase();

    this.expenseForm.controls['type_of_expense'].patchValue({
      group: translatedExpenseGroup
    });
    this.expenseForm.updateValueAndValidity();
  }

  public doShowCurrencyMenu(button: any): void {
    this.menuDropdownService
      .chooseOptions(
        button,
        this.currencyOptions.map((c) => ({
          code: c.value,
          nameKey: c.name,
          noTranslate: true
        }))
      )
      .subscribe((key) => {
        if (key) {
          this.expenseForm.patchValue({ currency: key });
        }
      });
  }

  private setObjectNo(expense: Pick<IExpense, 'attached_object'>) {
    switch (expense.attached_object.type) {
      case 'rto':
        this.object_no = expense.attached_object.object.rto_no;
        break;
      default:
        this.object_no = '';
    }
  }

  private initExpenseForm(expense: IExpense): void {
    this.isEditForm = true;
    this.expenseForm.patchValue(expense);
    this.expense = expense;
    this.setObjectNo(expense);
    this.updatePictures();
  }
}
