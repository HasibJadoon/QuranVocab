import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { KeyValuePipe } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { McitMeaningPipe } from '@lib-shared/common/common/pipes/meaning.pipe';
import { ACTIVITY_CODES_ADDITIONAL_SERVICE, ACTIVITY_CODES_COMMON, ACTIVITY_CODES_TRANSPORT_ROAD } from '@lib-shared/common/contract/activity-codes.domain';
import { PARK_SERVICE_ARTICLE_CODES, TRANSPORT_ROAD_ARTICLE_CODES } from '@lib-shared/common/contract/article-code.domain';
import { IContractVersion, IExpensesReinvoicingRules } from '@lib-shared/common/contract/contract-version.model';
import { ContractType } from '@lib-shared/common/contract/contract.domain';
import { IContract } from '@lib-shared/common/contract/contract.model';
import { McitDialogRef } from '@lib-shared/common/dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '@lib-shared/common/dialog/dialog.service';
import { IServiceRef, IVehicleCheckQuestion } from '@lib-shared/common/inspection/inspection.model';
import { IMeaning } from '@lib-shared/common/models/types.model';
import { McitPopupService } from '@lib-shared/common/services/popup.service';
import { McitWaitingService } from '@lib-shared/common/services/waiting.service';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Observable, Subject } from 'rxjs';
import { map, switchMap, takeUntil, tap, concatMap } from 'rxjs/operators';
import { ContractsHttpService } from '../../services/contracts-http.service';
import { InspectionsHttpService } from '../../services/inspections-http.service';
import { ContractVersionsHttpService } from '../../services/contract-versions-http.service';
import { DispatcherApiRoutesEnum } from '../../dispatcher-api-routes.domain';

export interface IAddInspectionstData {
  id: string;
  isEditForm: boolean;
  owner: string;
  apiRoute?: DispatcherApiRoutesEnum;
  third_party_id?: string;
}

@Component({
  selector: 'mcit-add-edit-transport-road-inspections-modal',
  templateUrl: './add-edit-transport-road-inspections-modal.component.html',
  styleUrls: ['./add-edit-transport-road-inspections-modal.component.scss'],
  providers: [McitMeaningPipe, KeyValuePipe]
})
export class McitAddEditTransportRoadInspectionsModalComponent implements OnInit, OnDestroy {
  destroy$: Subject<boolean> = new Subject<boolean>();
  contract: IContract;
  isDisabled = true;
  isEditMode = false;
  data: IAddInspectionstData = {
    id: null,
    isEditForm: false,
    owner: null
  };
  groupedChecks: any;
  isGroupExpanded = [];
  oldContractVersion: IContractVersion;
  contractVersionForm: UntypedFormGroup;
  version: string;
  apiRoute?: DispatcherApiRoutesEnum;
  checkQuestions: IVehicleCheckQuestion[];

  currentThirdPartyId: string;

  dataSource: Observable<IServiceRef[]>;
  loadingServices = false;
  currentLang: string;

  activityCodes: string[];
  articleCodes: string[];
  hasDerogatoryTypeServicesRight = false;

  dataForSortingQuestions: {
    key: string;
    sort: number;
    questions: {
      _id: string;
      sort: number;
    }[];
  }[] = [];

  public expensesTypesGroupsOptions = [
    {
      groupName: { value: 'customer', meaning: 'EXPENSES.GROUPS.CUSTOMER' },
      options: [
        { value: 'toll', meaning: 'EXPENSES.TYPES.TOLL' },
        { value: 'diesel', meaning: 'EXPENSES.TYPES.DIESEL' },
        { value: 'gasoline', meaning: 'EXPENSES.TYPES.GASOLINE' },
        { value: 'other', meaning: 'EXPENSES.TYPES.OTHER' }
      ]
    },
    {
      groupName: { value: 'operational', meaning: 'EXPENSES.GROUPS.OPERATIONAL' },
      options: [
        { value: 'toll', meaning: 'EXPENSES.TYPES.TOLL' },
        { value: 'diesel', meaning: 'EXPENSES.TYPES.DIESEL' },
        { value: 'gasoline', meaning: 'EXPENSES.TYPES.GASOLINE' },
        { value: 'parking meter', meaning: 'EXPENSES.TYPES.PARKING_METER' },
        { value: 'public transport', meaning: 'EXPENSES.TYPES.PUBLIC_TRANSPORT' },
        { value: 'stewardship', meaning: 'EXPENSES.TYPES.STEWARDSHIP' },
        { value: 'car wash', meaning: 'EXPENSES.TYPES.CAR_WASH' },
        { value: 'accommodation', meaning: 'EXPENSES.TYPES.ACCOMMODATION' },
        { value: 'meal', meaning: 'EXPENSES.TYPES.MEAL' },
        { value: 'other', meaning: 'EXPENSES.TYPES.OTHER' }
      ]
    }
  ];

  constructor(
    @Inject(MCIT_DIALOG_DATA) modalData: any,
    private dialogRef: McitDialogRef<McitAddEditTransportRoadInspectionsModalComponent>,
    private waitingService: McitWaitingService,
    private contractsHttpService: ContractsHttpService,
    private contractVersionsHttpService: ContractVersionsHttpService,
    private inspectionsHttpService: InspectionsHttpService,
    private popupService: McitPopupService,
    private meaningPipe: McitMeaningPipe,
    private formBuilder: UntypedFormBuilder,
    private translateService: TranslateService,
    private keyValuePipe: KeyValuePipe
  ) {
    this.currentLang = this.translateService.currentLang || 'default';
    this.data = Object.assign(this.data, modalData);
    this.currentThirdPartyId = this.data.owner ?? this.data.third_party_id;
    this.apiRoute = this.data.apiRoute;
    this.contractVersionForm = this.formBuilder.group({
      _id: [''],
      contract_id: [''],
      contract_type: [''],
      transport_road: this.formBuilder.group({
        refServiceName: [''],
        services: this.formBuilder.array([]),
        inspections: this.formBuilder.group({
          pickup: formBuilder.group({
            checks: formBuilder.array([]),
            damages: new UntypedFormControl({ value: false, disabled: true })
          }),
          delivery: formBuilder.group({
            checks: formBuilder.array([]),
            damages: new UntypedFormControl({ value: false, disabled: true })
          })
        }),
        expenses_reinvoicing_rules: this.formBuilder.array([])
      })
    });
    this.initExpensesReinvoicingRules();
    this.waitingService.showWaiting();

    this.inspectionsHttpService
      .getAllChecksQuestions('', this.currentThirdPartyId, this.apiRoute)
      .pipe(
        takeUntil(this.destroy$),
        tap((ref) => (this.checkQuestions = ref)),
        tap((ref) => {
          this.groupedChecks = this.keyValuePipe.transform(
            _.chain(ref)
              .groupBy((x) => this.meaningPipe.transform(x.group_name))
              .value()
          );
        }),
        concatMap(() => this.inspectionsHttpService.getSortOfQuestions(this.data.id)),
        tap((sortRes) => (this.dataForSortingQuestions = sortRes.groups)),
        concatMap(() => this.contractsHttpService.getContract(this.data.id))
      )
      .subscribe(
        (contract: IContract) => {
          this.contract = contract;
          this.contractVersionForm.get('contract_id').patchValue(contract._id);
          if (contract?.transport_road?.service_type?.length) {
            this.contractVersionForm.get('contract_type').patchValue(contract?.type);
          }

          let versions = [];
          if (contract.type === ContractType.TRSP_ROAD) {
            versions = contract.transport_road?.versions;
            this.articleCodes = [...TRANSPORT_ROAD_ARTICLE_CODES, ...PARK_SERVICE_ARTICLE_CODES];
            this.activityCodes = [...ACTIVITY_CODES_COMMON, ...ACTIVITY_CODES_TRANSPORT_ROAD, ...ACTIVITY_CODES_ADDITIONAL_SERVICE].sort();
          } else if (contract.type === ContractType.MEANS_ROAD) {
            versions = contract.means_road?.versions;
          }
          if (versions.length <= 0) {
            this.popupService.show('warning', 'COMMON_CONTRACTS.INSPECTIONS_MODAL.WARNING_CONTRAT_VERSION_NOT_EXIST');
            this.dialogRef.close();
          } else {
            this.contractVersionForm.get('_id').patchValue(versions[versions.length - 1]._id);
          }
          this.waitingService.hideWaiting();
        },
        () => {
          this.waitingService.hideWaiting();
          this.popupService.showError();
          this.dialogRef.close();
        }
      );

    this.contractVersionForm
      .get('_id')
      .valueChanges.pipe(
        tap((version) => {
          if (version) {
            this.isDisabled = false;
          }
        }),
        switchMap((version: string) => this.contractVersionsHttpService.get(version)),
        takeUntil(this.destroy$)
      )
      .subscribe((contractVersion) => {
        this.oldContractVersion = contractVersion;
        this.deleteAllCustomService();
        const inspections = contractVersion?.transport_road?.inspections;
        if (inspections) {
          this.sortGroupCheck(inspections.pickup?.checks, inspections.delivery?.checks);
          const pickChecks = inspections.pickup?.checks?.filter((check) => this.checkQuestions.find((cq) => cq._id === check));
          const delivChecks = inspections.delivery?.checks?.filter((check) => this.checkQuestions.find((cq) => cq._id === check));
          if (pickChecks.length !== inspections.pickup?.checks?.length || delivChecks?.length !== inspections.delivery.checks.length) {
            this.popupService.show('warning', 'COMMON_CONTRACTS.INSPECTIONS_MODAL.WARNING_CHECKS_CHANGE');
          }

          this.isEditMode = true;
          (contractVersion?.transport_road?.services || []).forEach((s) => {
            s.name = {
              [this.currentLang]: s.name?.[this.currentLang] || s.name?.[Object.keys(s.name)?.[0]] || s.code
            };
            this.doAddCustomService(s);
          });
          this.contractVersionForm.get(['transport_road', 'inspections', 'pickup', 'damages']).patchValue(inspections.pickup?.damages);
          (this.contractVersionForm.get(['transport_road', 'inspections', 'pickup']) as UntypedFormGroup).setControl('checks', formBuilder.array(pickChecks));
          this.contractVersionForm.get(['transport_road', 'inspections', 'delivery', 'damages']).patchValue(inspections.delivery?.damages);
          (this.contractVersionForm.get(['transport_road', 'inspections', 'delivery']) as UntypedFormGroup).setControl('checks', formBuilder.array(delivChecks));
        } else {
          this.isEditMode = false;
          this.contractVersionForm.get(['transport_road', 'inspections', 'pickup', 'damages']).patchValue(false);
          (this.contractVersionForm.get(['transport_road', 'inspections', 'pickup']) as UntypedFormGroup).setControl('checks', formBuilder.array([]));
          this.contractVersionForm.get(['transport_road', 'inspections', 'delivery', 'damages']).patchValue(false);
          (this.contractVersionForm.get(['transport_road', 'inspections', 'delivery']) as UntypedFormGroup).setControl('checks', formBuilder.array([]));
        }
        this.updateExpensesReinvoicingRules(contractVersion?.transport_road?.expenses_reinvoicing_rules);
        if (this.dataForSortingQuestions.length > 0) this.sortQuestionsByCustomOrder();
      });
  }

  initExpensesReinvoicingRules() {
    const expensesReinvoicingRulesformGroup = this.contractVersionForm.get(['transport_road', 'expenses_reinvoicing_rules']) as UntypedFormArray;
    this.expensesTypesGroupsOptions.forEach((group) => {
      const expensesReinvoicingRulesformOptions = this.formBuilder.array([]);
      group.options.forEach((option) => {
        const expensesReinvoicingRuleFrorm = this.formBuilder.group({
          group: group.groupName.value,
          type: option.value,
          invoicing: false,
          mark_up: 0,
          derogatory_article: null,
          derogatory_activity_code: null
        });
        expensesReinvoicingRulesformOptions.push(expensesReinvoicingRuleFrorm);
      });
      expensesReinvoicingRulesformGroup.push(expensesReinvoicingRulesformOptions);
    });
  }

  updateExpensesReinvoicingRules(expensesReinvoicingRules: IExpensesReinvoicingRules[]) {
    if (!expensesReinvoicingRules) {
      return;
    }
    const expensesReinvoicingRulesformGroup = this.contractVersionForm.get(['transport_road', 'expenses_reinvoicing_rules']).value;
    expensesReinvoicingRulesformGroup.forEach((group, i) => {
      group.forEach((option, j) => {
        const newExpensesReinvoicingRule = expensesReinvoicingRules.find((expensesReinvoicingRule) => expensesReinvoicingRule.group === option.group && expensesReinvoicingRule.type === option.type);
        const curentExpensesReinvoicingRule = this.contractVersionForm.get(['transport_road', 'expenses_reinvoicing_rules', i, j]);
        curentExpensesReinvoicingRule.get(['invoicing']).setValue(newExpensesReinvoicingRule?.invoicing);
        curentExpensesReinvoicingRule.get(['mark_up']).setValue(newExpensesReinvoicingRule?.mark_up);
        curentExpensesReinvoicingRule.get(['derogatory_activity_code']).setValue(newExpensesReinvoicingRule?.derogatory_activity_code);
        curentExpensesReinvoicingRule.get(['derogatory_article']).setValue(newExpensesReinvoicingRule?.derogatory_article);
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  ngOnInit(): void {
    this.dataSource = new Observable((observer: any) => {
      observer.next(this.contractVersionForm.get(['transport_road', 'refServiceName']).value);
    }).pipe(
      switchMap((token: string) => this.inspectionsHttpService.searchServices(token, 1, 10, '', this.currentThirdPartyId)),
      map((item) => item.filter((res) => !this.contractVersionForm.get(['transport_road', 'services'])['controls'].find((service) => service.get('code') && service.get('code').value === res.code)))
    );
  }

  getResponseType(checkType: string) {
    return checkType;
  }

  isGroupChecked(checkGroup, step) {
    const uncheckedFound = checkGroup.find((check) => {
      const checkedList = this.contractVersionForm.get(['transport_road', 'inspections', step, 'checks']).value;
      return checkedList.findIndex((checkId) => checkId === check._id) < 0;
    });
    return uncheckedFound ? false : true;
  }

  onGroupChange(isChecked, checkGroup, step) {
    const checkedList = this.contractVersionForm.get(['transport_road', 'inspections', step, 'checks']) as UntypedFormArray;
    checkGroup.forEach((check) => {
      const index = checkedList.value.findIndex((checkId) => checkId === check._id);
      if (index >= 0) {
        checkedList.removeAt(index);
      }
    });

    if (isChecked) {
      checkGroup.map((check) => {
        checkedList.push(new UntypedFormControl(check._id));
      });
    }
  }

  isCheckChecked(check, step) {
    const checkedList = this.contractVersionForm.get(['transport_road', 'inspections', step, 'checks']).value;
    return checkedList.findIndex((checkId) => checkId === check._id) >= 0 ? true : false;
  }

  onCheckChange(isChecked, check, step) {
    const checkedList = this.contractVersionForm.get(['transport_road', 'inspections', step, 'checks']) as UntypedFormArray;
    if (isChecked) {
      checkedList.push(new UntypedFormControl(check._id));
    } else {
      const findIndex = checkedList.value.findIndex((check_id) => check_id === check._id);
      checkedList.removeAt(findIndex);
    }
  }

  doAddCustomService(value?: any) {
    const services = this.contractVersionForm.get(['transport_road', 'services']) as UntypedFormArray;
    const serviceFormGroup = this.formBuilder.group({
      _id: [null],
      type: [this.contract?.transport_road?.service_type],
      code: [],
      name: this.formBuilder.group(
        Object.assign(
          {
            [this.currentLang]: ['', Validators.maxLength(256)]
          },
          IMeaning
        )
      ),
      price: [0],
      currency: [null],
      derogatory: this.formBuilder.group({
        article_code: '',
        activity_code: ''
      }),
      mandatory: false
    });

    if (value) {
      serviceFormGroup.patchValue(value);
      if (!this.hasDerogatoryTypeServicesRight) {
        serviceFormGroup.get('type').disable();
      }
      if (value.code) {
        serviceFormGroup.get('name').disable();
      }
    }

    services.push(serviceFormGroup);
  }

  doDeleteCustomService(indexLine: number): void {
    (this.contractVersionForm.get(['transport_road', 'services']) as UntypedFormArray).removeAt(indexLine);
  }

  drop(event: CdkDragDrop<string[]>, services: any[]) {
    moveItemInArray(services, event.previousIndex, event.currentIndex);
  }

  doSave(): void {
    this.waitingService.showWaiting();
    const inspectionConfig = this.contractVersionForm.getRawValue();
    const serviceList = this.contractVersionForm.get(['transport_road', 'services']).value;
    const newPickup = [];
    const newDelivery = [];
    this.groupedChecks.map((checkArray) =>
      checkArray.value.map((check) => {
        const value = this.contractVersionForm.get(['transport_road', 'inspections', 'pickup', 'checks']).value.find((pickupCheckId) => check._id === pickupCheckId);
        if (value) {
          newPickup.push(value);
        }
      })
    );
    this.groupedChecks.map((checkArray) =>
      checkArray.value.map((check) => {
        const value = this.contractVersionForm.get(['transport_road', 'inspections', 'delivery', 'checks']).value.find((pickupCheckId) => check._id === pickupCheckId);
        if (value) {
          newDelivery.push(value);
        }
      })
    );
    inspectionConfig.transport_road = _.merge(this.oldContractVersion?.transport_road, inspectionConfig?.transport_road);
    inspectionConfig.transport_road.inspections.pickup.checks = newPickup;
    inspectionConfig.transport_road.inspections.delivery.checks = newDelivery;
    inspectionConfig.transport_road.services = serviceList;
    inspectionConfig.transport_road.expenses_reinvoicing_rules = this.contractVersionForm.get(['transport_road', 'expenses_reinvoicing_rules']).value.flat();
    inspectionConfig.transport_road.expenses_reinvoicing_rules = inspectionConfig.transport_road.expenses_reinvoicing_rules.filter((expense) => expense.invoicing);
    this.contractVersionsHttpService
      .update(inspectionConfig)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          this.waitingService.hideWaiting();
          this.dialogRef.close();
        },
        () => {
          this.waitingService.hideWaiting();
          this.popupService.showError();
          this.dialogRef.close();
        }
      );

    this.inspectionsHttpService.saveQuestionsSort(this.data.id, this.groupedChecks).subscribe();
  }

  goBack(): void {
    this.dialogRef.close();
  }

  doChangeLoading(event: boolean): void {
    this.loadingServices = event;
  }

  doSelected(event): void {
    this.contractVersionForm.get(['transport_road', 'refServiceName']).setValue(event.item.code + ' - ' + this.meaningPipe.transform(event.item.name));
    event.item.name = {
      ...event.item.name,
      [this.currentLang]: event.item.name[this.currentLang] || event.item.name[Object.keys(event.item.name)[0]]
    };
    this.doAddCustomService(event.item);
  }

  private deleteAllCustomService(): void {
    const formArray = this.contractVersionForm.get(['transport_road', 'services']) as UntypedFormArray;
    while (formArray.length !== 0) {
      formArray.removeAt(0);
    }
  }

  private sortGroupCheck(pickup: string[], delivery: string[]) {
    const newGroupedChecks = [];
    this.sortCheckQuestion(pickup, delivery);
    let cloneDelivery = _.clone(delivery);
    pickup.map((p) => {
      const indexDelivery = cloneDelivery.findIndex((id) => id === p);
      if (indexDelivery === -1) {
        const inspection = this.groupedChecks.find((checkArray) => checkArray.value.find((v) => v._id === p));
        if (inspection && !newGroupedChecks.find((checkArray) => checkArray.key === inspection.key)) {
          newGroupedChecks.push(inspection);
        }
      } else if (indexDelivery === 0) {
        const inspection = this.groupedChecks.find((checkArray) => checkArray.value.find((v) => v._id === p));
        if (inspection && !newGroupedChecks.find((checkArray) => checkArray.key === inspection.key)) {
          newGroupedChecks.push(inspection);
        }
        cloneDelivery = cloneDelivery.slice(1);
      } else {
        let compteur = 0;
        while (indexDelivery !== compteur) {
          const inspection2 = this.groupedChecks.find((checkArray) => checkArray.value.find((v) => v._id === cloneDelivery[compteur]));
          if (inspection2 && !newGroupedChecks.find((checkArray) => checkArray.key === inspection2.key)) {
            newGroupedChecks.push(inspection2);
          }
          compteur++;
        }
        const inspection = this.groupedChecks.find((checkArray) => checkArray.value.find((v) => v._id === p));
        if (inspection && !newGroupedChecks.find((checkArray) => checkArray.key === inspection.key)) {
          newGroupedChecks.push(inspection);
        }
        cloneDelivery = cloneDelivery.slice(indexDelivery + 1);
      }
    });
    for (let compteurDelivery = 0; compteurDelivery < cloneDelivery.length; compteurDelivery++) {
      const inspection = this.groupedChecks.find((checkArray) => checkArray.value.find((v) => v._id === cloneDelivery[compteurDelivery]));
      if (inspection && !newGroupedChecks.find((checkArray) => checkArray.key === inspection.key)) {
        newGroupedChecks.push(inspection);
      }
      compteurDelivery++;
    }
    this.groupedChecks.map((checkArray) => {
      if (!newGroupedChecks.find((checkArray2) => checkArray.key === checkArray2.key)) {
        newGroupedChecks.push(checkArray);
      }
    });
    this.groupedChecks = newGroupedChecks;
  }

  private sortCheckQuestion(pickup: string[], delivery: string[]) {
    const newCheckQuestions = [];
    let cloneDelivery = _.clone(delivery);
    pickup.map((p) => {
      const indexDelivery = cloneDelivery.findIndex((id) => id === p);
      if (indexDelivery === -1) {
        const inspect = this.checkQuestions.find((question) => question._id === p);
        newCheckQuestions.push(inspect);
      } else if (indexDelivery === 0) {
        const inspect = this.checkQuestions.find((question) => question._id === p);
        newCheckQuestions.push(inspect);
        cloneDelivery = cloneDelivery.slice(1);
      } else {
        let compteur = 0;
        while (indexDelivery !== compteur) {
          const inspect2 = this.checkQuestions.find((question) => question._id === cloneDelivery[compteur]);
          newCheckQuestions.push(inspect2);
          compteur++;
        }
        const inspect = this.checkQuestions.find((question) => question._id === p);
        newCheckQuestions.push(inspect);
        cloneDelivery = cloneDelivery.slice(indexDelivery + 1);
      }
    });
    for (let compteurDelivery = 0; compteurDelivery < cloneDelivery.length; compteurDelivery++) {
      const inspect = this.checkQuestions.find((question) => question._id === cloneDelivery[compteurDelivery]);
      newCheckQuestions.push(inspect);
      compteurDelivery++;
    }
    const newCheckQuestions2 = _.compact(newCheckQuestions);
    this.checkQuestions.map((question) => {
      if (!newCheckQuestions2.find((quesion2) => question._id === quesion2._id)) {
        newCheckQuestions2.push(question);
      }
    });
    this.checkQuestions = newCheckQuestions2;
    this.groupedChecks = this.keyValuePipe.transform(
      _.chain(newCheckQuestions2)
        .groupBy((x) => this.meaningPipe.transform(x.group_name))
        .value()
    );
  }

  sortQuestionsByCustomOrder() {
    const sortedChecks = [];
    this.groupedChecks.forEach((group) => {
      let questions = group.value;
      const sortedGroup = this.dataForSortingQuestions.find((sortedGroup) => sortedGroup.key === group.key);
      questions.sort((a, b) => {
        const sortA = sortedGroup.questions.find((question: any) => question._id === a._id)?.sort;
        const sortB = sortedGroup.questions.find((question: any) => question._id === b._id)?.sort;
        if (sortA === undefined && sortB === undefined) return 0;
        if (sortA === undefined) return 1;
        if (sortB === undefined) return -1;
        return sortA - sortB;
      });
      sortedChecks.push({ key: group.key, value: questions, sort: sortedGroup?.sort });
    });
    sortedChecks.sort((a, b) => {
      if (a.sort === undefined && b.sort === undefined) return 0;
      if (a.sort === undefined) return 1;
      if (b.sort === undefined) return -1;
      return a.sort - b.sort;
    });
    this.groupedChecks = sortedChecks;
  }
}
