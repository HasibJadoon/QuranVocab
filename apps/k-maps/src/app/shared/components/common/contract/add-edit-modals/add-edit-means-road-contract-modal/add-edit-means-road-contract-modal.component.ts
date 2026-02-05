import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import * as lodash from 'lodash';
import { Subscription } from 'rxjs';
import { DispatcherApiRoutesEnum } from '../../../../../../../dispatcher/src/app/business/services/offers-http.service';
import { IDistanceCalculator } from '../../../../../../../supervision/src/app/business/models/distance-calculator.model';
import { McitMeaningPipe } from '../../../common/pipes/meaning.pipe';
import { McitDialogRef } from '../../../dialog/dialog-ref';
import { McitDialog, MCIT_DIALOG_DATA } from '../../../dialog/dialog.service';
import { InitialDistanceCalculator } from '../../../models/domains/distance-calculator.domain';
import { CurrencyEnum } from '../../../services/currency.service';
import { DistanceCalculatorsHttpService } from '../../../services/distance-calculators-http.service';
import { McitPopupService } from '../../../services/popup.service';
import { McitWaitingService } from '../../../services/waiting.service';
import { ACTIVITY_CODES_COMMON, ACTIVITY_CODES_MEANS_ROAD } from '../../activity-codes.domain';
import { MeansRoadArticleCode } from '../../article-code.domain';
import { ContractType } from '../../contract.domain';
import { IContract, IContractVersionRef, IPartialBunker, IPricingCriterion } from '../../contract.model';
import { EmptyDistanceRetributionOption, EMPTY_DISTANCE_RETRIBUTION_OPTIONS } from '../../empty-distance-retribution-options.domain';
import { InvoicingSoftware } from '../../invoicing-software.domain';
import { PricingFormula } from '../../pricing-formula.domain';
import { ServiceType } from '../../service-type.domain';
import { ContractsHttpService } from '../../services/contracts-http.service';
import { McitDayDistancePriceModalService } from '../pricing-mode-modals/day-distance-price-modal/day-distance-price-modal.service';
import { McitDayPriceModalService } from '../pricing-mode-modals/day-price-modal/day-price-modal.service';
import { McitDistancePriceModalService } from '../pricing-mode-modals/distance-price-modal/distance-price-modal.service';
import { McitDistanceRangePriceModalService } from '../pricing-mode-modals/distance-range-price-modal/distance-range-price-modal.service';
import { PricingGridModalComponent } from '../pricing-mode-modals/pricing-grid-modal/pricing-grid-modal.component';
import { BunkersHttpService } from '../../../../../../../accounting/src/app/business/services/taxation/bunkers-http.service';

@Component({
  selector: 'mcit-add-edit-means-road-contract-modal',
  templateUrl: './add-edit-means-road-contract-modal.component.html',
  styleUrls: ['./add-edit-means-road-contract-modal.component.scss'],
  providers: [McitMeaningPipe]
})
export class McitAddEditMeansRoadContractModalComponent implements OnInit, OnDestroy {
  readonly DEFAULT_ACTIVITY_CODE: string = '362';
  readonly DEFAULT_CURRENCY: string = 'EUR';
  readonly DEFAULT_ARTICLE_CODE = MeansRoadArticleCode['2ZZE100050'];
  readonly DEFAULT_DISTANCE_CALCULATOR = InitialDistanceCalculator.PTV_TRUCK40T;
  readonly DEFAULT_EMPTY_DISTANCE_RETRIBUTION_OPTION: EmptyDistanceRetributionOption = EmptyDistanceRetributionOption.EMPTY_DISTANCE_BEFORE_TRIP;
  readonly EMPTY_DISTANCE_RETRIBUTION_OPTIONS = EMPTY_DISTANCE_RETRIBUTION_OPTIONS;
  readonly EMPTY_DISTANCE_RETRIBUTION_OPTIONS_ENUM = EmptyDistanceRetributionOption;
  bunkers: IPartialBunker[] = [];
  data: {
    id: string;
    isEditForm: boolean;
    purchaseOrSale: string;
    apiRoute: DispatcherApiRoutesEnum;
    isDisabled: boolean;
    type: ContractType;
    currentThirdParty: {
      _id: string;
      name: string;
    };
  } = {
    id: null,
    isEditForm: false,
    purchaseOrSale: null,
    apiRoute: null,
    isDisabled: false,
    type: null,
    currentThirdParty: null
  };

  pricingFormulas: PricingFormula[] = [PricingFormula.DISTANCE, PricingFormula.DAY, PricingFormula.DAY_DISTANCE, PricingFormula.DISTANCE_RANGE, PricingFormula.PRICING_GRID];
  activityCodes = [...ACTIVITY_CODES_COMMON, ...ACTIVITY_CODES_MEANS_ROAD].sort();
  distanceCalculatorList: IDistanceCalculator[];

  currencyOptions: { symbol: string; name: string }[] = Object.keys(CurrencyEnum).map((key) => ({
    symbol: CurrencyEnum[key] as string,
    name: key as string
  }));

  contractForm: UntypedFormGroup;
  submitAttempt = false;

  displaySmallScreen = true;

  versionsArray: UntypedFormArray;

  idVersions: { [key: string]: number } = {};
  private editContract: IContract;
  private subscriptions: Subscription[] = [];
  private versionsOpenMode: string = 'first';
  private versionsOpenStatus: boolean[] = [];
  private ownerId: string;

  constructor(
    @Inject(MCIT_DIALOG_DATA)
    private modalData: {
      id: string;
      isEditForm: boolean;
      purchaseOrSale: string;
      apiRoute: DispatcherApiRoutesEnum;
      isDisabled: boolean;
      type: ContractType;
    },
    private dialogRef: McitDialogRef<McitAddEditMeansRoadContractModalComponent>,
    private formBuilder: UntypedFormBuilder,
    private contractsHttpService: ContractsHttpService,
    private popupService: McitPopupService,
    private waitingService: McitWaitingService,
    private distanceCalculatorHttpService: DistanceCalculatorsHttpService,
    private dayDistancePriceModalService: McitDayDistancePriceModalService,
    private dayPriceModalService: McitDayPriceModalService,
    private distancePriceModalService: McitDistancePriceModalService,
    private distanceRangePriceModalService: McitDistanceRangePriceModalService,
    private dialog: McitDialog,
    private bunkersHttpService: BunkersHttpService
  ) {
    this.data = Object.assign(this.data, modalData);
    this.contractForm = this.formBuilder.group({
      code: [{ value: '', disabled: this.data.isDisabled }, Validators.compose([Validators.pattern(/^[a-zA-Z\d]+$/), Validators.maxLength(256), Validators.required])],
      name: [{ value: '', disabled: this.data.isDisabled }, Validators.compose([Validators.maxLength(256), Validators.required])],
      supplier: [{ value: null, disabled: this.data.isDisabled }, Validators.required],
      currency: [{ value: this.DEFAULT_CURRENCY, disabled: this.data.isDisabled }, Validators.required],
      distance_calculator: [{ value: this.DEFAULT_DISTANCE_CALCULATOR, disabled: this.data.isDisabled }, Validators.required],
      activity_code: [{ value: this.DEFAULT_ACTIVITY_CODE, disabled: this.data.isDisabled }, Validators.required],
      empty_distance_retribution: [this.DEFAULT_EMPTY_DISTANCE_RETRIBUTION_OPTION, Validators.required],
      trips_distance_calculation: null,
      versions: this.formBuilder.array([], Validators.required),
      expenses_approval_required: [true],
      split_empty_kilometers: [false]
    });
    this.versionsArray = this.contractForm.get('versions') as UntypedFormArray;
  }

  private validateMinDate(): ValidatorFn {
    return (c: AbstractControl) => {
      if (c) {
        if (!c.get('date_end').value || !c.get('date_start').value) {
          return null;
        } else {
          return c.get('date_end').value >= c.get('date_start').value ? null : { validateMinDate: true };
        }
      }
    };
  }

  ngOnInit(): void {
    this.waitingService.showWaiting();
    this.distanceCalculatorHttpService.search('', 1, 100, 'code', '_id,code,label').subscribe((distanceCalculator) => {
      this.distanceCalculatorList = distanceCalculator.body;
      if (this.data.isEditForm) {
        this.initEditForm();
      } else {
        this.ownerId = this.data.currentThirdParty._id;
        this.getBunkers();
        this.doAddVersion();
        this.waitingService.hideWaiting();
      }
    });
  }

  private initEditForm(): void {
    this.contractsHttpService.getContract(this.data.id).subscribe(
      (contract: IContract) => {
        this.ownerId = contract.owner.third_party_id;
        this.getBunkers();
        this.editContract = contract;
        this.contractForm.patchValue({
          code: this.editContract.code,
          name: this.editContract.name,
          supplier: this.editContract.supplier,
          currency: this.editContract.currency || this.DEFAULT_CURRENCY,
          distance_calculator: this.editContract.means_road.distance_calculator || this.DEFAULT_DISTANCE_CALCULATOR,
          activity_code: this.editContract.activity_code || this.DEFAULT_ACTIVITY_CODE,
          empty_distance_retribution: this.editContract.means_road.empty_distance_retribution || this.DEFAULT_EMPTY_DISTANCE_RETRIBUTION_OPTION,
          trips_distance_calculation: this.editContract.means_road.trips_distance_calculation || null,
          expenses_approval_required: this.editContract.means_road.expenses_approval_required,
          split_empty_kilometers: this.editContract.means_road.split_empty_kilometers
        });
        this.controlSplitKilometersInvoice(this.editContract.means_road.empty_distance_retribution);
        if (this.editContract?.means_road?.versions) {
          for (const version of this.editContract?.means_road?.versions) {
            this.doAddVersion(version);
          }
        }
        this.waitingService.hideWaiting();
      },
      () => {
        this.waitingService.hideWaiting();
        this.popupService.showError();
        this.dialogRef.close();
      }
    );
  }

  doAddVersion(versionRef?: IContractVersionRef): void {
    const formVersion = {
      _id: [null],
      date_start: [{ value: null, disabled: this.data.isDisabled }, Validators.required],
      date_end: [{ value: null, disabled: this.data.isDisabled }],
      pricing_lines: this.formBuilder.array([])
    };

    const group = this.formBuilder.group(formVersion, { validator: this.validateMinDate() });
    (this.contractForm.get('versions') as UntypedFormArray).push(group);
    this.versionsOpenStatus.push(!versionRef);
    if (versionRef) {
      this.contractsHttpService.getContractVersion(versionRef._id).subscribe((fullVersion) => {
        const dataVersion = {
          _id: versionRef._id,
          date_start: versionRef.date_start,
          date_end: versionRef.date_end
        };

        group.patchValue(dataVersion);
        for (const l of fullVersion.means_road?.main_tarif?.pricing_lines) {
          this.doAddPricingLine(group, l);
        }
      });
    }
  }

  doDeleteVersion(index: number): void {
    (this.contractForm.get('versions') as UntypedFormArray).removeAt(index);
    this.versionsOpenStatus.splice(index, 1);
  }

  doToggleVersionsOpenMode(openMode: string): void {
    this.versionsOpenMode = openMode;
    switch (openMode) {
      case 'all':
        this.versionsOpenStatus = new Array(this.versionsOpenStatus.length).fill(true);
        break;
      default:
        this.versionsOpenStatus = new Array(this.versionsOpenStatus.length).fill(false);
    }
  }

  doToggleVersionOpenStatus(openStatus: boolean, index: number) {
    this.versionsOpenStatus[index] = openStatus;
  }

  doAddPricingLine(versionGroup: AbstractControl, pricingLine?: IPricingCriterion): void {
    const pricesControl = versionGroup.get('pricing_lines') as UntypedFormArray;
    const group = this.formBuilder.group({
      formula: [{ value: null, disabled: this.data.isDisabled }],
      distance_pricing: [{}],
      day_pricing: [{}],
      day_distance_pricing: [{}],
      distance_range_pricing: [{}],
      pricing_grid: [{}],
      bunker_index: [null]
    });
    pricesControl.push(group);
    if (pricingLine) {
      group.patchValue({ ...pricingLine, bunker_index: pricingLine?.bunker_index?._id ?? null });
    } else {
      group.patchValue({ formula: this.pricingFormulas[0] });
    }
  }

  doDeletePricingLine(indexVersion: number, indexLine: number): void {
    ((this.contractForm.get('versions') as UntypedFormArray).at(indexVersion).get('pricing_lines') as UntypedFormArray).removeAt(indexLine);
  }

  doEditPrice(formula: PricingFormula, pricingLineControl: AbstractControl): void {
    switch (formula) {
      case PricingFormula.DISTANCE:
        this.doEditDistancePrice(pricingLineControl);
        break;
      case PricingFormula.DAY:
        this.doEditDayPrice(pricingLineControl);
        break;
      case PricingFormula.DAY_DISTANCE:
        this.doEditDayDistancePrice(pricingLineControl);
        break;
      case PricingFormula.DISTANCE_RANGE:
        this.doEditDistanceRangePrice(pricingLineControl);
        break;
      case PricingFormula.PRICING_GRID:
        this.doEditPricingGrid(pricingLineControl);
        break;
    }
  }

  private doEditDistancePrice(pricingLineControl: AbstractControl): void {
    this.distancePriceModalService
      .showModal({
        distance_pricing: pricingLineControl.value?.distance_pricing
      })
      .subscribe((result) => {
        if (result) {
          pricingLineControl.get('distance_pricing').setValue(result);
        }
      });
  }

  private doEditDayPrice(pricingLineControl: AbstractControl): void {
    this.dayPriceModalService
      .showModal({
        day_pricing: pricingLineControl.value?.day_pricing
      })
      .subscribe((result) => {
        if (result) {
          pricingLineControl.get('day_pricing').setValue(result);
        }
      });
  }

  private doEditDayDistancePrice(pricingLineControl: AbstractControl): void {
    this.dayDistancePriceModalService
      .showModal({
        day_distance_pricing: pricingLineControl.value?.day_distance_pricing
      })
      .subscribe((result) => {
        if (result) {
          pricingLineControl.get('day_distance_pricing').setValue(result);
        }
      });
  }

  private doEditDistanceRangePrice(pricingLineControl: AbstractControl): void {
    this.distanceRangePriceModalService
      .showModal({
        distance_range_pricing: pricingLineControl.value?.distance_range_pricing
      })
      .subscribe((result) => {
        if (result) {
          pricingLineControl.get('distance_range_pricing').setValue(result);
        }
      });
  }

  private doEditPricingGrid(pricingLineControl: AbstractControl): void {
    const dialogRef = this.dialog.open(PricingGridModalComponent, {
      dialogClass: 'modal-lg',
      data: {
        vinOrTrip: ServiceType.TRIP,
        pricing_grid: pricingLineControl.value?.pricing_grid,
        isDisabled: this.data.isDisabled,
        apiRoute: this.data.apiRoute
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        pricingLineControl.get('pricing_grid').setValue(result);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  drop(event: CdkDragDrop<string[]>, pricingLines: any[]): void {
    moveItemInArray(pricingLines, event.previousIndex, event.currentIndex);
  }

  goBack(): void {
    this.dialogRef.close();
  }

  doSave(): void {
    this.submitAttempt = true;

    if (!this.contractForm.valid || this.checkFormulasForMercurio()) {
      return;
    }

    const form = this.contractForm.getRawValue();

    form.versions.map((version) =>
      version.pricing_lines.map((line) => {
        switch (line.formula) {
          case PricingFormula.DISTANCE:
            delete line.day_pricing;
            delete line.day_distance_pricing;
            delete line.distance_range_pricing;
            delete line.pricing_grid;
            break;
          case PricingFormula.DAY:
            delete line.distance_pricing;
            delete line.day_distance_pricing;
            delete line.distance_range_pricing;
            delete line.pricing_grid;
            break;
          case PricingFormula.DAY_DISTANCE:
            delete line.day_pricing;
            delete line.distance_pricing;
            delete line.distance_range_pricing;
            delete line.pricing_grid;
            break;
          case PricingFormula.DISTANCE_RANGE:
            delete line.day_pricing;
            delete line.distance_pricing;
            delete line.day_distance_pricing;
            delete line.pricing_grid;
            break;
          case PricingFormula.PRICING_GRID:
            delete line.day_pricing;
            delete line.distance_pricing;
            delete line.day_distance_pricing;
            delete line.distance_range_pricing;
        }
        line.bunker_index = this.bunkers.find((bunker) => bunker._id === line.bunker_index);
      })
    );
    const obj: IContract = {
      code: (form.code as string).toUpperCase(),
      name: form.name,
      type: ContractType.MEANS_ROAD,
      supplier: form.supplier,
      activity_code: form.activity_code,
      currency: form.currency,
      accounting: {
        ...(this.editContract?.accounting || {}),
        invoicing_software: InvoicingSoftware.MOVEECAR,
        article_code: this.DEFAULT_ARTICLE_CODE
      },
      means_road: {
        versions: form.versions,
        distance_calculator: form.distance_calculator ?? this.DEFAULT_DISTANCE_CALCULATOR,
        empty_distance_retribution: form.empty_distance_retribution ?? this.DEFAULT_EMPTY_DISTANCE_RETRIBUTION_OPTION,
        trips_distance_calculation: form.empty_distance_retribution === EmptyDistanceRetributionOption.EMPTY_DISTANCE_AFTER_TRIP ? form.trips_distance_calculation || false : undefined,
        expenses_approval_required: form.expenses_approval_required,
        split_empty_kilometers: form.split_empty_kilometers
      }
    };

    if (this.data.isEditForm) {
      const updated = lodash.assign({}, lodash.cloneDeep(this.editContract), obj);
      this.update(updated);
    } else {
      this.create(obj as IContract);
    }
  }

  private update(contract: IContract): void {
    this.waitingService.showWaiting();
    this.contractsHttpService.updateContract(contract, this.data?.currentThirdParty?._id).subscribe(
      () => {
        this.waitingService.hideWaiting();
        this.popupService.showSuccess('COMMON_CONTRACTS.MODAL.EDIT_SUCCESS', {
          messageParams: { name: contract.code }
        });
        this.dialogRef.close(contract._id);
      },
      (err) => {
        this.waitingService.hideWaiting();
        if (err.status === 422) {
          this.popupService.showError('COMMON_CONTRACTS.MODAL.ERROR.CODE_ALREADY_EXIST');
        } else {
          this.popupService.showError();
        }
      }
    );
  }

  private create(contract: IContract): void {
    this.waitingService.showWaiting();
    this.contractsHttpService.createContract(contract, this.data?.currentThirdParty?._id).subscribe(
      (next) => {
        this.waitingService.hideWaiting();
        this.popupService.showSuccess('COMMON_CONTRACTS.MODAL.ADD_SUCCESS', {
          messageParams: { name: contract.code }
        });
        this.dialogRef.close(next);
      },
      () => {
        this.waitingService.hideWaiting();
        this.popupService.showError();
      }
    );
  }

  checkFormulasForMercurio(): boolean {
    const foundVersionWithOtherThanDistanceRangeFormula = !!this.contractForm.get('versions').value.find((version) => !!version.pricing_lines.find((pricingLine) => pricingLine.formula !== PricingFormula.DISTANCE_RANGE));
    const isTripDistanceCalculation = !!(this.contractForm.get('empty_distance_retribution').value === EmptyDistanceRetributionOption.EMPTY_DISTANCE_AFTER_TRIP
      ? this.contractForm.get('trips_distance_calculation').value || false
      : undefined);
    return isTripDistanceCalculation && foundVersionWithOtherThanDistanceRangeFormula;
  }

  controlSplitKilometersInvoice(event) {
    if (event === EmptyDistanceRetributionOption.NO_EMPTY_DISTANCE_RETRIBUTION) {
      this.contractForm.patchValue({
        split_empty_kilometers: false
      });
      this.contractForm.get('split_empty_kilometers').disable();
    } else {
      this.contractForm.get('split_empty_kilometers').enable();
    }
  }

  getBunkers(): void {
    this.bunkersHttpService.search('', this.ownerId, 1, 100).subscribe((response) => {
      this.bunkers = response.body.results.map((bunker) => ({
        _id: bunker._id,
        code: bunker.code
      }));
    });
  }
}
