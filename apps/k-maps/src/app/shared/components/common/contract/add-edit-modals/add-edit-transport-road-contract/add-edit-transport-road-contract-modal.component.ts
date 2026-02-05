import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ACTIVITY_CODES_COMMON, ACTIVITY_CODES_TRANSPORT_ROAD } from '@lib-shared/common/contract/activity-codes.domain';
import { ValorizationModalComponent } from '@lib-shared/common/contract/add-edit-modals/add-edit-transport-road-contract/valorization-modal/valorization-modal.component';
import { TransportRoadArticleCode } from '@lib-shared/common/contract/article-code.domain';
import { ContractRoleRestriction, ContractType, CONTRACT_ROLES_RESTRICTIONS } from '@lib-shared/common/contract/contract.domain';
import { IContract, IContractVersionRef, IPartialBunker, IPricingCriterion, ITimeLimit } from '@lib-shared/common/contract/contract.model';
import { DispatcherApiRoutesEnum } from '@lib-shared/common/contract/dispatcher-api-routes.domain';
import { InvoicingSoftware } from '@lib-shared/common/contract/invoicing-software.domain';
import { EditMemberRoleModalComponent } from '@lib-shared/common/contract/member-role-field/edit-member-role-modal/edit-member-role-modal.component';
import { PricingFormula, TransportRoadContractPricingFormula, TRANSPORT_ROAD_CONTRACT_PRICING_FORMULAS } from '@lib-shared/common/contract/pricing-formula.domain';
import { ServiceType, getContractServiceTypes } from '@lib-shared/common/contract/service-type.domain';
import { ThirdPartiesHttpService } from '@lib-shared/common/contract/services/third-parties-http.service';
import { ContractsHttpService } from '@lib-shared/common/contract/services/contracts-http.service';
import { StartEvent, START_EVENTS } from '@lib-shared/common/contract/start-event.domain';
import { TimeLimitType, TIME_LIMIT_TYPES } from '@lib-shared/common/contract/time-limit.domain';
import { TRANSPORT_ROAD_TYPES } from '@lib-shared/common/contract/transport-road-type.domain';
import { VehicleBusinessType, VEHICLE_BUSINESS_TYPES } from '@lib-shared/common/contract/vehicle-business-type.domain';
import { McitDialogRef } from '@lib-shared/common/dialog/dialog-ref';
import { McitDialog, MCIT_DIALOG_DATA } from '@lib-shared/common/dialog/dialog.service';
import { InitialDistanceCalculator } from '@lib-shared/common/models/domains/distance-calculator.domain';
import { IMemberRole } from '@lib-shared/common/models/member-role.model';
import { CurrencyEnum } from '@lib-shared/common/services/currency.service';
import { DistanceCalculatorsHttpService } from '@lib-shared/common/services/distance-calculators-http.service';
import { McitPopupService } from '@lib-shared/common/services/popup.service';
import { McitWaitingService } from '@lib-shared/common/services/waiting.service';
import { IThirdParty } from '@lib-shared/common/third-party/third-party.model';
import * as lodash from 'lodash';
import { Subscription } from 'rxjs';
import { EditDefaultDepartureArrivalModalComponent } from '../edit-default-departure-arrival-modal/edit-default-departure-arrival-modal.component';
import { FixedPriceModalComponent } from '../pricing-mode-modals/fixed-price-modal/fixed-price-modal.component';
import { KmPriceModalComponent } from '../pricing-mode-modals/km-price-modal/km-price-modal.component';
import { PricingClientModalComponent } from '../pricing-mode-modals/pricing-client-modal/pricing-client-modal.component';
import { PricingGridModalComponent } from '../pricing-mode-modals/pricing-grid-modal/pricing-grid-modal.component';
import { RangePriceModalComponent } from '../pricing-mode-modals/range-price-modal/range-price-modal.component';
import { TripCategoryFixedModalComponent } from '../pricing-mode-modals/trip-categorie-fixed-modal/trip-categorie-fixed-modal.component';
import { TripCategoryKmModalComponent } from '../pricing-mode-modals/trip-categorie-km-modal/trip-categorie-km-modal.component';
import { TripCategoryRangeModalComponent } from '../pricing-mode-modals/trip-categorie-range-modal/trip-categorie-range-modal.component';
import { VinCategoryFixedModalComponent } from '../pricing-mode-modals/vin-categorie-fixed-modal/vin-categorie-fixed-modal.component';
import { VinCategoryKmModalComponent } from '../pricing-mode-modals/vin-categorie-km-modal/vin-categorie-km-modal.component';
import { VinCategoryRangedModalComponent } from '../pricing-mode-modals/vin-categorie-ranged-modal/vin-categorie-ranged-modal.component';
import { BunkersHttpService } from '../../../../../../../accounting/src/app/business/services/taxation/bunkers-http.service';
import { EditDefaultSubscriptionModalComponent } from '@lib-shared/common/contract/add-edit-modals/edit-default-subscription-modal/edit-default-subscription-modal.component';

interface IContractTransportRoadForm {
  _id: string;
  // date debut de validité de la version
  date_start: string;
  // date fin de validité de la version
  date_end?: string;
  // malus si véhicule non roulant (si rolling_vehicles_only = false)
  non_rolling_fixed_malus?: number; // par vin
  // critères de calcul du prix, parcourir dans l'ordre
  pricing_lines: IPricingCriterion[];
  // délai
  time_limit?: ITimeLimit;
  // début de comptage du délai
  start_event: StartEvent;
}

@Component({
  selector: 'mcit-add-edit-transport-road-contract-modal',
  templateUrl: './add-edit-transport-road-contract-modal.component.html',
  styleUrls: ['./add-edit-transport-road-contract-modal.component.scss']
})
export class McitAddEditTransportRoadContractModalComponent implements OnInit, OnDestroy {
  readonly TIME_LIMIT_VALUE_PATTERN = /^\d+$/;
  readonly VIN_PRICING_FORMULAS: TransportRoadContractPricingFormula[];
  readonly TRIP_PRICING_FORMULAS: TransportRoadContractPricingFormula[];

  data: {
    id: string;
    isEditForm: boolean;
    purchaseOrSale: string;
    apiRoute: DispatcherApiRoutesEnum;
    isDisabled: boolean;
    type: ContractType;
    currentThirdParty: { _id: string; name: string };
  } = {
    id: null,
    isEditForm: false,
    purchaseOrSale: null,
    isDisabled: false,
    type: null,
    apiRoute: null,
    currentThirdParty: null
  };

  pricingFormulas: TransportRoadContractPricingFormula[];
  currencyOptions: { symbol: string; name: string }[] = Object.keys(CurrencyEnum).map((key) => ({
    symbol: CurrencyEnum[key] as string,
    name: key as string
  }));

  editedContract: IContract = null;
  contractForm: UntypedFormGroup;

  versionsTransportTrip: IContractTransportRoadForm[];
  versionsTransportVin: IContractTransportRoadForm[];
  submitAttempt = false;
  activityCodes = [...ACTIVITY_CODES_COMMON, ...ACTIVITY_CODES_TRANSPORT_ROAD].sort();
  transportTypes = TRANSPORT_ROAD_TYPES;
  serviceTypes = getContractServiceTypes(this.data.type);
  states = VEHICLE_BUSINESS_TYPES;
  contractRolesRestrictions = CONTRACT_ROLES_RESTRICTIONS;
  distanceCalculatorList = [];

  billedCustomer: IThirdParty;
  principalCustomer: IThirdParty;

  ownerId: string;
  bunkers: IPartialBunker[] = [];

  contractTags;

  departure: IMemberRole;
  arrival: IMemberRole;

  entity: string;

  version: IContractTransportRoadForm;
  timeLimits = TIME_LIMIT_TYPES;
  startEvents = START_EVENTS;

  private subscriptions: Subscription[] = [];
  private versionsOpenMode: string = 'first';
  private versionsOpenStatus: boolean[] = [];

  constructor(
    @Inject(MCIT_DIALOG_DATA)
    modalData: {
      id: string;
      isEditForm: boolean;
      purchaseOrSale: string;
      isDisabled: boolean;
      type: ContractType;
      currentThirdParty: { _id: string; name: string };
      supplier: null;
    },
    private dialogRef: McitDialogRef<McitAddEditTransportRoadContractModalComponent>,
    private dialog: McitDialog,
    private formBuilder: UntypedFormBuilder,
    private popupService: McitPopupService,
    private waitingService: McitWaitingService,
    private transportContractHttpService: ContractsHttpService,
    private memberRoleThirdPartiesHttpService: ThirdPartiesHttpService,
    private distanceCalculatorsHttpService: DistanceCalculatorsHttpService,
    private bunkersHttpService: BunkersHttpService
  ) {
    this.data = Object.assign(this.data, modalData);

    this.VIN_PRICING_FORMULAS = TRANSPORT_ROAD_CONTRACT_PRICING_FORMULAS.filter((formula) => !formula.startsWith('TRIP'));
    this.TRIP_PRICING_FORMULAS = TRANSPORT_ROAD_CONTRACT_PRICING_FORMULAS.filter((formula) => !formula.startsWith('VIN'));

    this.pricingFormulas = this.VIN_PRICING_FORMULAS;

    const group = {
      code: [{ value: '', disabled: this.data.isDisabled }, Validators.compose([Validators.pattern(/^[a-zA-Z\d]+$/), Validators.maxLength(256), Validators.required])],
      name: [{ value: '', disabled: this.data.isDisabled }, Validators.compose([Validators.minLength(1), Validators.maxLength(256), Validators.required])],
      supplier: [null],
      activity_code: [{ value: '', disabled: this.data.isDisabled }, Validators.required],
      _principal_customer: [null],
      principal_customers: [[]],
      _billed_customer: [null],
      billed_customers: [[]],
      tags: [[]],
      customer_tags: [[]],
      required_expertise: [[]],
      currency: [{ value: this.currencyOptions[0].name, disabled: this.data.isDisabled }, Validators.required],
      versions: this.formBuilder.array([], Validators.required),
      invoicing_software: [Validators.required],
      service_type: [{ value: ServiceType.VIN, disabled: this.data.isDisabled }, Validators.required],
      mean_order: [{ value: false, disabled: this.data.isDisabled }],
      transport_type: [{ value: TRANSPORT_ROAD_TYPES[0], disabled: this.data.isDisabled }, Validators.required],
      rolling_vehicles_only: [{ value: false, disabled: this.data.isDisabled }],
      _departure: [null],
      departure: [[], [this.validateArrayLength(1)]],
      _arrival: [null],
      arrival: [[], [this.validateArrayLength(1)]],
      vnvo_type: [{ value: VehicleBusinessType.VO, disabled: this.data.isDisabled }],
      product_code: [[]],
      rank: [],
      default_departure: [null],
      default_arrival: [null],
      default_supplier: [null],
      check_pod_manually: [null],
      role_restriction: [{ value: ContractRoleRestriction.NONE, disabled: this.data.isDisabled }],
      distance_calculator: [InitialDistanceCalculator.PTV_TRUCK40T, Validators.required],
      tarif_use_end_date: [Validators.required]
    };
    this.contractForm = this.formBuilder.group(group);
    this.contractForm.get('invoicing_software').setValue(InvoicingSoftware.MOVEECAR);
  }

  ngOnInit(): void {
    this.waitingService.showWaiting();
    this.distanceCalculatorsHttpService.searchAllBy('', 'label', 'code,label').subscribe((res) => {
      this.distanceCalculatorList = res.body;
    });
    this.subscriptions.push(
      this.contractForm.get('_billed_customer').valueChanges.subscribe((next) => {
        if (next) {
          this.billedCustomer = next;
        } else {
          this.billedCustomer = null;
        }
      })
    );
    this.subscriptions.push(
      this.contractForm.get('_principal_customer').valueChanges.subscribe((next) => {
        if (next) {
          this.principalCustomer = next;
        } else {
          this.principalCustomer = null;
        }
      })
    );

    if (this.data.type === ContractType.TRSP_ROAD) {
      this.subscriptions.push(
        this.contractForm.get('_departure').valueChanges.subscribe((next) => {
          if (next) {
            this.departure = next;
          } else {
            this.departure = null;
          }
        })
      );
      this.subscriptions.push(
        this.contractForm.get('_arrival').valueChanges.subscribe((next) => {
          if (next) {
            this.arrival = next;
          } else {
            this.arrival = null;
          }
        })
      );
      this.subscriptions.push(
        this.contractForm.get('mean_order').valueChanges.subscribe(() => {
          this.contractForm.get('arrival').updateValueAndValidity();
          this.contractForm.get('departure').updateValueAndValidity();
        })
      );
    }

    if (this.data.isEditForm) {
      this.transportContractHttpService.getContract(this.data.id, undefined, false, ContractType.TRSP_ROAD).subscribe(
        (contract: IContract) => {
          this.ownerId = contract.owner.third_party_id;
          this.getBunkers();
          this.editedContract = contract;
          // patch value des données commune a tout type de contract
          this.contractForm.patchValue({
            code: contract.code,
            name: contract.name,
            supplier: contract.supplier,
            activity_code: contract.activity_code ? contract.activity_code : '',
            principal_customers: contract.principal_customers,
            billed_customers: contract.billed_customers,
            tags: contract.tags,
            customer_tags: contract.customer_tags ?? [],
            required_expertise: contract.required_expertise ?? [],
            currency: contract.currency,
            role_restriction: contract.transport_road?.role_restriction,
            invoicing_software: contract.accounting?.invoicing_software,
            mean_order: contract.transport_road?.mean_order,
            transport_type: contract.transport_road?.transport_type,
            rolling_vehicles_only: contract.transport_road?.rolling_vehicles_only,
            departure: contract.transport_road?.departure,
            arrival: contract.transport_road?.arrival,
            service_type: contract.transport_road?.service_type,
            vnvo_type: contract.transport_road?.vnvo_type,
            product_code: contract.transport_road?.product_code,
            rank: contract.transport_road?.rank,
            default_departure: contract.transport_road?.default_departure,
            default_arrival: contract.transport_road?.default_arrival,
            default_supplier: contract.transport_road?.default_supplier,
            check_pod_manually: contract.transport_road?.check_pod_manually,
            distance_calculator: contract.transport_road?.distance_calculator ?? InitialDistanceCalculator.PTV_TRUCK40T,
            tarif_use_end_date: contract.transport_road?.tarif_use_end_date ?? false
          });

          this.memberRoleThirdPartiesHttpService.get(this.ownerId).subscribe((thirdParty) => {
            if (this.data.purchaseOrSale === 'sale') {
              this.contractForm.patchValue({
                supplier: {
                  third_party_id: thirdParty._id,
                  name: thirdParty.name,
                  code: thirdParty.code,
                  obtpop: thirdParty.obtpop,
                  obplatform: thirdParty.obplatform,
                  obcenter: thirdParty.obcenter
                }
              });
            }
          });

          const trspVersionRefs: IContractVersionRef[] = contract?.transport_road?.versions;
          const trspServiceType = contract?.transport_road?.service_type;
          if (trspVersionRefs) {
            for (const v of trspVersionRefs) {
              this.doAddVersion(v);
            }
          }
          if (trspServiceType) {
            this.changePricingFormulas(trspServiceType);
          }
          this.waitingService.hideWaiting();
        },
        () => {
          this.waitingService.hideWaiting();
          this.popupService.showError();
          this.dialogRef.close();
        }
      );
    } else {
      this.ownerId = this.data?.currentThirdParty?._id;
      this.getBunkers();
      this.editedContract = this.contractForm.getRawValue(); // Needed for icons list
      this.doAddVersion();
      if (this.data.purchaseOrSale === 'sale') {
        this.memberRoleThirdPartiesHttpService.get(this.ownerId).subscribe((thirdParty) => {
          if (thirdParty && !this.contractForm.get('supplier').value) {
            this.contractForm.patchValue({
              supplier: {
                third_party_id: thirdParty._id,
                name: thirdParty.name,
                code: thirdParty.code,
                obtpop: thirdParty.obtpop,
                obplatform: thirdParty.obplatform,
                obcenter: thirdParty.obcenter
              }
            });
          }
        });
      } else {
        this.memberRoleThirdPartiesHttpService.get(this.ownerId).subscribe((thirdParty) => {
          this.contractForm.patchValue({
            principal_customers: [
              {
                third_party_id: thirdParty._id,
                name: thirdParty.name,
                code: thirdParty.code,
                obtpop: thirdParty.obtpop,
                obplatform: thirdParty.obplatform,
                obcenter: thirdParty.obcenter
              }
            ],
            billed_customers: [
              {
                third_party_id: thirdParty._id,
                name: thirdParty.name,
                code: thirdParty.code,
                obtpop: thirdParty.obtpop,
                obplatform: thirdParty.obplatform,
                obcenter: thirdParty.obcenter
              }
            ]
          });
        });
      }
      this.waitingService.hideWaiting();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  checkSupplierAndCustomers(): boolean {
    const supplier = this.contractForm.get('supplier').value;
    const billedCustomers = this.contractForm.get('billed_customers').value as Array<any>;
    const principalCustomers = this.contractForm.get('principal_customers').value as Array<any>;
    return !supplier && billedCustomers.length === 0 && principalCustomers.length === 0;
  }

  checkCustomersPurchaseContract(): boolean {
    const billedCustomers = this.contractForm.get('billed_customers').value.map((billed) => billed.third_party_id);
    const principalCustomers = this.contractForm.get('principal_customers').value.map((principal) => principal.third_party_id);
    return this.data.purchaseOrSale === 'purchase' && !(billedCustomers.includes(this.ownerId) || principalCustomers.includes(this.ownerId));
  }

  doSave(): void {
    this.submitAttempt = true;
    if (!this.contractForm.valid) {
      return;
    }

    const form = this.contractForm.getRawValue();
    const obj: IContract = {
      code: form.code,
      name: form.name,
      type: ContractType.TRSP_ROAD,
      supplier: form.supplier,
      activity_code: form.activity_code,
      principal_customers: form.principal_customers,
      billed_customers: form.billed_customers,
      tags: form.tags,
      customer_tags: form.customer_tags,
      required_expertise: form.required_expertise,
      currency: form.currency,
      accounting: {
        ...this.editedContract.accounting,
        invoicing_software: form.invoicing_software ? form.invoicing_software : InvoicingSoftware.MOVEECAR,
        article_code: form.service_type === ServiceType.TRIP ? TransportRoadArticleCode['2ZT0000520'] : TransportRoadArticleCode['2ZT0000500']
      }
    };

    if (this.data.isEditForm && form.service_type === this.editedContract.transport_road?.service_type && this.editedContract.accounting.article_code) {
      obj.accounting.article_code = this.editedContract.accounting.article_code;
    }

    const trspVersions: IContractTransportRoadForm[] = form.versions.map((version) => {
      const timeLimit = {
        type: version.time_limit_type,
        value: version.time_limit_value
      };
      if (version.time_limit_type || version.time_limit_value) {
        version.time_limit = lodash.omitBy(timeLimit, lodash.isNil);
      }
      delete version.time_limit_type;
      delete version.time_limit_value;
      if (!lodash.isNil(lodash.get(obj, 'transport_road.rolling_vehicles_only'))) {
        delete version.non_rolling_fixed_malus;
      }
      return version;
    });
    trspVersions.map((version) =>
      version.pricing_lines.map((line) => {
        if (line.formula && line.formula.startsWith('VIN_')) {
          delete line.trip_pricing;
          delete line.pricing_grid;
          delete line.pricing_client;
          if (line.vin_pricing) {
            switch (line.formula) {
              case PricingFormula.VIN_FIXED:
                delete line.vin_pricing.range;
                delete line.vin_pricing.km;
                delete line.vin_pricing.categories_km;
                delete line.vin_pricing.categories_range;
                delete line.vin_pricing.categories_fixed;
                break;
              case PricingFormula.VIN_KM:
                delete line.vin_pricing.range;
                delete line.vin_pricing.fixed_price;
                delete line.vin_pricing.categories_km;
                delete line.vin_pricing.categories_range;
                delete line.vin_pricing.categories_fixed;
                break;
              case PricingFormula.VIN_RANGE:
                delete line.vin_pricing.fixed_price;
                delete line.vin_pricing.km;
                delete line.vin_pricing.categories_km;
                delete line.vin_pricing.categories_range;
                delete line.vin_pricing.categories_fixed;
                break;
              case PricingFormula.VIN_CATEGORY_RANGE:
                delete line.vin_pricing.range;
                delete line.vin_pricing.km;
                delete line.vin_pricing.categories_km;
                delete line.vin_pricing.fixed_price;
                delete line.vin_pricing.categories_fixed;
                break;
              case PricingFormula.VIN_CATEGORY_FIXED:
                delete line.vin_pricing.range;
                delete line.vin_pricing.km;
                delete line.vin_pricing.categories_km;
                delete line.vin_pricing.categories_range;
                delete line.vin_pricing.fixed_price;
                break;
              case PricingFormula.VIN_CATEGORY_KM:
                delete line.vin_pricing.range;
                delete line.vin_pricing.km;
                delete line.vin_pricing.fixed_price;
                delete line.vin_pricing.categories_range;
                delete line.vin_pricing.categories_fixed;
                break;
            }
          }
        } else if (line.formula && line.formula.startsWith('TRIP_')) {
          delete line.vin_pricing;
          delete line.pricing_grid;
          delete line.pricing_client;
          if (line.vin_pricing) {
            switch (line.formula) {
              case PricingFormula.TRIP_FIXED:
                delete line.trip_pricing.range;
                delete line.trip_pricing.km;
                delete line.trip_pricing.categories_km;
                delete line.trip_pricing.categories_range;
                delete line.trip_pricing.categories_fixed;
                break;
              case PricingFormula.TRIP_KM:
                delete line.trip_pricing.range;
                delete line.trip_pricing.fixed_price;
                delete line.trip_pricing.categories_km;
                delete line.trip_pricing.categories_range;
                delete line.trip_pricing.categories_fixed;
                break;
              case PricingFormula.TRIP_RANGE:
                delete line.trip_pricing.fixed_price;
                delete line.trip_pricing.km;
                delete line.trip_pricing.categories_km;
                delete line.trip_pricing.categories_range;
                delete line.trip_pricing.categories_fixed;
                break;
              case PricingFormula.TRIP_CATEGORY_RANGE:
                delete line.trip_pricing.range;
                delete line.trip_pricing.km;
                delete line.trip_pricing.categories_km;
                delete line.trip_pricing.fixed_price;
                delete line.trip_pricing.categories_fixed;
                break;
              case PricingFormula.TRIP_CATEGORY_FIXED:
                delete line.trip_pricing.range;
                delete line.trip_pricing.km;
                delete line.trip_pricing.categories_km;
                delete line.trip_pricing.categories_range;
                delete line.trip_pricing.fixed_price;
                break;
              case PricingFormula.TRIP_CATEGORY_KM:
                delete line.trip_pricing.range;
                delete line.trip_pricing.km;
                delete line.trip_pricing.fixed_price;
                delete line.trip_pricing.categories_range;
                delete line.trip_pricing.categories_fixed;
                break;
            }
          }
        } else if (line.formula && line.formula === PricingFormula.PRICING_GRID) {
          delete line.trip_pricing;
          delete line.vin_pricing;
          delete line.pricing_client;
        } else if (line.formula && line.formula === PricingFormula.PRICING_CLIENT) {
          delete line.trip_pricing;
          delete line.vin_pricing;
          delete line.pricing_grid;
        }
        line.bunker_index = this.bunkers.find((bunker) => bunker._id === (line.bunker_index as unknown));
      })
    );
    obj['transport_road'] = {
      mean_order: form.mean_order,
      transport_type: form.transport_type,
      rolling_vehicles_only: form.rolling_vehicles_only,
      departure: form.departure,
      arrival: form.arrival,
      service_type: form.service_type,
      vnvo_type: form.vnvo_type,
      product_code: form.product_code ? form.product_code : [],
      rank: form.rank,
      versions: trspVersions,
      default_departure: form.default_departure,
      default_arrival: form.default_arrival,
      default_supplier: form.default_supplier,
      check_pod_manually: form.check_pod_manually,
      role_restriction: form.role_restriction,
      distance_calculator: form.distance_calculator,
      tarif_use_end_date: form.tarif_use_end_date
    };

    if (this.data.isEditForm) {
      const updated = lodash.assign({}, lodash.cloneDeep(this.editedContract), obj);
      this.update(updated);
    } else {
      this.create(obj);
    }
  }

  private update(contract: IContract): void {
    this.waitingService.showWaiting();
    this.transportContractHttpService.updateContract(contract, this.ownerId).subscribe(
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

    this.transportContractHttpService.createContract(contract, this.ownerId).subscribe(
      (next) => {
        this.waitingService.hideWaiting();
        this.popupService.showSuccess('COMMON_CONTRACTS.MODAL.ADD_SUCCESS', {
          messageParams: { name: contract.code }
        });

        this.dialogRef.close(next);
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

  onTagListChange(list: any[]): void {
    this.contractForm.get('tags').setValue(list);
  }

  onCustomerTagListChange(list: any[]): void {
    this.contractForm.get('customer_tags').setValue(list);
  }

  onRequiredExpertiseListChange(list: any[]): void {
    this.contractForm.get('required_expertise').setValue(list);
  }

  onTimeLimitTypeChange(version: any, value: TimeLimitType = TimeLimitType.NONE): void {
    if (!this.data.isDisabled) {
      if (value === TimeLimitType.NONE) {
        version.controls?.time_limit_value?.patchValue(null);
        version.controls?.time_limit_value?.disable();
      } else {
        version.controls?.time_limit_value?.enable();
      }
    }
  }

  goBack(): void {
    this.dialogRef.close();
  }

  doChangeSupplier(memberRole: IMemberRole): void {
    if (memberRole) {
      const supplier: IMemberRole = {
        third_party_id: memberRole.third_party_id,
        name: memberRole.name,
        code: memberRole.code,
        obtpop: memberRole.obtpop,
        obplatform: memberRole.obplatform,
        obcenter: memberRole.obcenter
      };
      this.contractForm.get('supplier').setValue(supplier);
    }
  }

  doAddBilled(): void {
    const memberRoles = (this.contractForm.get('billed_customers').value ?? []) as IThirdParty[];
    memberRoles.push(this.billedCustomer);
    this.contractForm.get('billed_customers').setValue(memberRoles);

    this.billedCustomer = null;
    this.contractForm.get('_billed_customer').reset();
  }

  doEditBilled(index: number): void {
    const billed = this.contractForm.get('billed_customers').value[index];
    const dialogRef = this.dialog.open(EditMemberRoleModalComponent, {
      dialogClass: 'modal-lg',
      data: {
        memberRole: billed,
        role: 'BILLED',
        useCarrierAddress: false,
        useSubscriptions: true,
        isDisabled: this.data.isDisabled,
        apiRoute: this.data.apiRoute
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.contractForm.controls['billed_customers'].value[index] = result;
      }
    });
  }

  doDeleteBilled(index: number): void {
    const memberRoles = this.contractForm.get('billed_customers').value as IThirdParty[];
    this.contractForm.get('billed_customers').setValue(memberRoles.filter((v, i) => i !== index));
  }

  doAddPrincipal(): void {
    const memberRoles = (this.contractForm.get('principal_customers').value ?? []) as IThirdParty[];
    if (lodash.isArray(this.principalCustomer)) {
      this.principalCustomer.forEach((principal) => {
        if (!memberRoles.find((role) => role.third_party_id === principal.third_party_id)) {
          memberRoles.push(principal);
        }
      });
    } else {
      memberRoles.push(this.principalCustomer);
    }
    this.contractForm.get('principal_customers').setValue(memberRoles);

    this.billedCustomer = null;
    this.contractForm.get('_principal_customer').reset();
  }

  doEditPrincipal(index: number): void {
    const principal = this.contractForm.get('principal_customers').value[index];
    const dialogRef = this.dialog.open(EditMemberRoleModalComponent, {
      dialogClass: 'modal-lg',
      data: {
        memberRole: principal,
        role: 'PRINCIPAL',
        useCarrierAddress: false,
        useSubscriptions: true,
        isDisabled: this.data.isDisabled,
        apiRoute: this.data.apiRoute
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.contractForm.controls['principal_customers'].value[index] = result;
      }
    });
  }

  doDeletePrincipal(index: number): void {
    const memberRoles = this.contractForm.get('principal_customers').value as IThirdParty[];
    this.contractForm.get('principal_customers').setValue(memberRoles.filter((v, i) => i !== index));
  }

  doAddDeparture(): void {
    const memberRoles = (this.contractForm.get('departure').value ?? []) as IMemberRole[];
    memberRoles.push(this.departure);
    this.contractForm.get('departure').setValue(memberRoles);

    this.departure = null;
    this.contractForm.get('_departure').reset();
  }

  doEditDeparture(index: number): void {
    const departure = this.contractForm.get('departure').value[index];
    const dialogRef = this.dialog.open(EditMemberRoleModalComponent, {
      dialogClass: 'modal-lg',
      data: {
        memberRole: departure,
        role: 'PICKUP',
        useCarrierAddress: false,
        useSubscriptions: true,
        isDisabled: this.data.isDisabled,
        apiRoute: this.data.apiRoute
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.contractForm.controls['departure'].value[index] = result;
      }
    });
  }

  doDeleteDeparture(index: number): void {
    const memberRoles = this.contractForm.get('departure').value as IMemberRole[];
    this.contractForm.get('departure').setValue(memberRoles.filter((v, i) => i !== index));
  }

  doAddArrival(): void {
    const memberRoles = (this.contractForm.get('arrival').value ?? []) as IMemberRole[];
    memberRoles.push(this.arrival);
    this.contractForm.get('arrival').setValue(memberRoles);

    this.arrival = null;
    this.contractForm.get('_arrival').reset();
  }

  doEditArrival(index: number): void {
    const arrival = this.contractForm.get('arrival').value[index];
    const dialogRef = this.dialog.open(EditMemberRoleModalComponent, {
      dialogClass: 'modal-lg',
      data: {
        memberRole: arrival,
        role: 'DELIVERY',
        useCarrierAddress: false,
        useSubscriptions: true,
        isDisabled: this.data.isDisabled,
        apiRoute: this.data.apiRoute
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.contractForm.controls['arrival'].value[index] = result;
      }
    });
  }

  doDeleteArrival(index: number): void {
    const memberRoles = this.contractForm.get('arrival').value as IMemberRole[];
    this.contractForm.get('arrival').setValue(memberRoles.filter((v, i) => i !== index));
  }

  doAddValorization(): void {
    const dialogRef = this.dialog.open(ValorizationModalComponent, {
      dialogClass: 'modal-xl',
      data: {
        product_code: lodash.get(this.contractForm.value, 'product_code', []),
        invoicing_software: lodash.get(this.contractForm.value, 'invoicing_software', InvoicingSoftware.MOVEECAR),
        rank: lodash.get(this.contractForm.value, 'rank'),
        isDisabled: this.data.isDisabled,
        type: this.data.type
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.contractForm.get('invoicing_software').setValue(result.invoicing_software);
        if (this.data.type === ContractType.TRSP_ROAD) {
          this.contractForm.get('rank').setValue(result.rank);
          this.contractForm.get('product_code').setValue(result.product_code);
        }
      }
    });
  }

  private requiredIfType(): ValidatorFn {
    return (c: AbstractControl) => {
      if (c) {
        if (!c.get('time_limit_type').value) {
          return null;
        } else {
          return c.get('time_limit_type').value !== TimeLimitType.NONE && !c.get('time_limit_value').value ? { required_type: true } : null;
        }
      }
    };
  }

  doAddVersion(versionRef?: IContractVersionRef): void {
    const configFormVersion = {
      _id: [null],
      date_start: [null, Validators.required],
      date_end: [null],
      pricing_lines: this.formBuilder.array([]),
      fixed_price: [null],
      non_rolling_fixed_malus: [{ value: null, disabled: this.data.isDisabled }],
      time_limit_type: [{ value: TimeLimitType.NONE, disabled: this.data.isDisabled }],
      time_limit_value: [{ value: null, disabled: this.data.isDisabled }, Validators.compose([Validators.min(0), Validators.pattern(this.TIME_LIMIT_VALUE_PATTERN)])],
      start_event: [{ value: StartEvent.MAD, disabled: this.data.isDisabled }]
    };

    const group = this.formBuilder.group(configFormVersion, { validator: Validators.compose([this.requiredIfType()]) });
    (this.contractForm.get('versions') as UntypedFormArray).push(group);
    this.versionsOpenStatus.push(!versionRef);
    if (versionRef) {
      this.transportContractHttpService.getContractVersion(versionRef._id).subscribe((fullVersion) => {
        const dataVersion = {
          _id: versionRef._id,
          date_start: versionRef.date_start,
          date_end: versionRef.date_end,
          non_rolling_fixed_malus: fullVersion?.transport_road?.main_tarif?.non_rolling_fixed_malus,
          time_limit_value: fullVersion?.transport_road?.main_tarif?.time_limit?.value,
          time_limit_type: fullVersion?.transport_road?.main_tarif?.time_limit?.type,
          start_event: fullVersion?.transport_road?.main_tarif?.start_event
        };

        group.patchValue(dataVersion);
        this.onTimeLimitTypeChange(group, fullVersion?.transport_road?.main_tarif?.time_limit?.type);
        if (fullVersion?.transport_road?.main_tarif?.pricing_lines?.length > 0) {
          for (const l of fullVersion.transport_road.main_tarif.pricing_lines) {
            this.doAddPricingLine(group, l);
          }
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
    if (this.data.type === ContractType.TRSP_ROAD) {
      const group = this.formBuilder.group({
        formula: [{ value: null, disabled: this.data.isDisabled }],
        vin_pricing: [{}],
        trip_pricing: [{}],
        pricing_grid: [{}],
        pricing_client: [{}],
        bunker_index: [null]
      });
      pricesControl.push(group);
      if (pricingLine) {
        const trspPricingLine = pricingLine as IPricingCriterion;
        group.patchValue({
          formula: trspPricingLine.formula ?? this.pricingFormulas[0],
          vin_pricing: trspPricingLine.vin_pricing ?? {},
          trip_pricing: trspPricingLine.trip_pricing ?? {},
          pricing_grid: trspPricingLine.pricing_grid ?? {},
          pricing_client: trspPricingLine.pricing_client ?? {},
          bunker_index: trspPricingLine?.bunker_index?._id ?? null
        });
      } else {
        group.patchValue({ formula: this.pricingFormulas[0] });
      }
    }
  }

  doDeletePricingLine(indexVersion: number, indexLine: number): void {
    ((this.contractForm.get('versions') as UntypedFormArray).at(indexVersion).get('pricing_lines') as UntypedFormArray).removeAt(indexLine);
  }

  doAddPrice(formula: PricingFormula, pricingLineControl: AbstractControl): void {
    switch (formula) {
      case PricingFormula.VIN_FIXED:
        this.doAddVinFixedPrice(pricingLineControl);
        break;
      case PricingFormula.VIN_KM:
        this.doAddVinKmPrice(pricingLineControl);
        break;
      case PricingFormula.VIN_RANGE:
        this.doAddVinRangePrice(pricingLineControl);
        break;
      case PricingFormula.VIN_CATEGORY_FIXED:
        this.doAddVinCategorieFixedPrice(pricingLineControl);
        break;
      case PricingFormula.VIN_CATEGORY_RANGE:
        this.doAddVinCategorieRangedPrice(pricingLineControl);
        break;
      case PricingFormula.VIN_CATEGORY_KM:
        this.doAddVinCategorieKmPrice(pricingLineControl);
        break;
      case PricingFormula.TRIP_FIXED:
        this.doAddTripFixedPrice(pricingLineControl);
        break;
      case PricingFormula.TRIP_KM:
        this.doAddTripKmPrice(pricingLineControl);
        break;
      case PricingFormula.TRIP_RANGE:
        this.doAddTripRangePrice(pricingLineControl);
        break;
      case PricingFormula.TRIP_CATEGORY_FIXED:
        this.doAddTripCategorieFixedPrice(pricingLineControl);
        break;
      case PricingFormula.TRIP_CATEGORY_KM:
        this.doAddTripCategorieKmPrice(pricingLineControl);
        break;
      case PricingFormula.TRIP_CATEGORY_RANGE:
        this.doAddTripCategorieRangePrice(pricingLineControl);
        break;
      case PricingFormula.PRICING_GRID:
        this.doAddPricingGrid(pricingLineControl);
        break;
      case PricingFormula.PRICING_CLIENT:
        this.doAddPricingClient(pricingLineControl);
        break;
    }
  }

  doAddTripFixedPrice(pricingLineControl: AbstractControl): void {
    const dialogRef = this.dialog.open(FixedPriceModalComponent, {
      dialogClass: 'modal-lg',
      data: {
        fixedPrice: lodash.get(pricingLineControl.value, 'trip_pricing.fixed_price'),
        title: 'COMMON_CONTRACTS.MODAL.VERSION.PRICING_LINES.TRIP_PRICING.FIXED_PRICE.TITLE',
        isDisabled: this.data.isDisabled
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result || result === 0) {
        pricingLineControl.get('trip_pricing').setValue({
          fixed_price: result
        });
      }
    });
  }

  doAddVinFixedPrice(pricingLineControl: AbstractControl): void {
    const dialogRef = this.dialog.open(FixedPriceModalComponent, {
      dialogClass: 'modal-lg',
      data: {
        fixedPrice: lodash.get(pricingLineControl.value, 'vin_pricing.fixed_price'),
        title: 'COMMON_CONTRACTS.MODAL.VERSION.PRICING_LINES.VIN_PRICING.FIXED_PRICE.TITLE',
        isDisabled: this.data.isDisabled
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result || result === 0) {
        pricingLineControl.get('vin_pricing').setValue({
          fixed_price: result
        });
      }
    });
  }

  doAddVinKmPrice(pricingLineControl: AbstractControl): void {
    const dialogRef = this.dialog.open(KmPriceModalComponent, {
      dialogClass: 'modal-lg',
      data: {
        title: 'COMMON_CONTRACTS.MODAL.VERSION.PRICING_LINES.VIN_PRICING.KM.TITLE',
        threshold: lodash.get(pricingLineControl.value, 'vin_pricing.km.threshold'),
        base_price: lodash.get(pricingLineControl.value, 'vin_pricing.km.base_price'),
        unit_price: lodash.get(pricingLineControl.value, 'vin_pricing.km.unit_price'),
        min_price: lodash.get(pricingLineControl.value, 'vin_pricing.km.min_price'),
        isDisabled: this.data.isDisabled
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        pricingLineControl.get('vin_pricing').setValue({
          km: {
            threshold: result.threshold,
            base_price: result.base_price,
            unit_price: result.unit_price,
            min_price: result.min_price
          }
        });
      }
    });
  }

  doAddTripKmPrice(pricingLineControl: AbstractControl): void {
    const dialogRef = this.dialog.open(KmPriceModalComponent, {
      dialogClass: 'modal-lg',
      data: {
        title: 'COMMON_CONTRACTS.MODAL.VERSION.PRICING_LINES.TRIP_PRICING.KM.TITLE',
        threshold: lodash.get(pricingLineControl.value, 'trip_pricing.km.threshold'),
        base_price: lodash.get(pricingLineControl.value, 'trip_pricing.km.base_price'),
        unit_price: lodash.get(pricingLineControl.value, 'trip_pricing.km.unit_price'),
        min_price: lodash.get(pricingLineControl.value, 'trip_pricing.km.min_price'),
        isDisabled: this.data.isDisabled
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        pricingLineControl.get('trip_pricing').setValue({
          km: {
            threshold: result.threshold,
            base_price: result.base_price,
            unit_price: result.unit_price,
            min_price: result.min_price
          }
        });
      }
    });
  }

  doAddVinRangePrice(pricingLineControl: AbstractControl): void {
    const dialogRef = this.dialog.open(RangePriceModalComponent, {
      dialogClass: 'modal-lg',
      data: {
        title: 'COMMON_CONTRACTS.MODAL.VERSION.PRICING_LINES.VIN_PRICING.RANGE.TITLE',
        min: lodash.get(pricingLineControl.value, 'vin_pricing.range.min'),
        max: lodash.get(pricingLineControl.value, 'vin_pricing.range.max'),
        price: lodash.get(pricingLineControl.value, 'vin_pricing.range.price'),
        isDisabled: this.data.isDisabled
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        pricingLineControl.get('vin_pricing').setValue({
          range: {
            min: result.min,
            max: result.max,
            price: result.price
          }
        });
      }
    });
  }

  doAddTripRangePrice(pricingLineControl: AbstractControl): void {
    const dialogRef = this.dialog.open(RangePriceModalComponent, {
      dialogClass: 'modal-lg',
      data: {
        title: 'COMMON_CONTRACTS.MODAL.VERSION.PRICING_LINES.TRIP_PRICING.RANGE.TITLE',
        min: lodash.get(pricingLineControl.value, 'trip_pricing.range.min'),
        max: lodash.get(pricingLineControl.value, 'trip_pricing.range.max'),
        price: lodash.get(pricingLineControl.value, 'trip_pricing.range.price'),
        isDisabled: this.data.isDisabled
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        pricingLineControl.get('trip_pricing').setValue({
          range: {
            min: result.min,
            max: result.max,
            price: result.price
          }
        });
      }
    });
  }

  doAddTripCategorieFixedPrice(pricingLineControl: AbstractControl): void {
    const dialogRef = this.dialog.open(TripCategoryFixedModalComponent, {
      dialogClass: 'modal-xl',
      data: {
        categories_fixed: lodash.get(pricingLineControl.value, 'trip_pricing.categories_fixed'),
        isDisabled: this.data.isDisabled,
        apiRoute: this.data.apiRoute
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        pricingLineControl.get('trip_pricing').setValue({
          categories_fixed: result
        });
      }
    });
  }

  doAddVinCategorieFixedPrice(pricingLineControl: AbstractControl): void {
    const dialogRef = this.dialog.open(VinCategoryFixedModalComponent, {
      dialogClass: 'modal-xl',
      data: {
        categories_fixed: lodash.get(pricingLineControl.value, 'vin_pricing.categories_fixed'),
        isDisabled: this.data.isDisabled,
        apiRoute: this.data.apiRoute
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        pricingLineControl.get('vin_pricing').setValue({
          categories_fixed: result
        });
      }
    });
  }

  doAddVinCategorieRangedPrice(pricingLineControl: AbstractControl): void {
    const dialogRef = this.dialog.open(VinCategoryRangedModalComponent, {
      dialogClass: 'modal-xl',
      data: {
        categories_range: lodash.get(pricingLineControl.value, 'vin_pricing.categories_range'),
        isDisabled: this.data.isDisabled,
        apiRoute: this.data.apiRoute
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        pricingLineControl.get('vin_pricing').setValue({
          categories_range: result
        });
      }
    });
  }

  doAddTripCategorieRangePrice(pricingLineControl: AbstractControl): void {
    const dialogRef = this.dialog.open(TripCategoryRangeModalComponent, {
      dialogClass: 'modal-xl',
      data: {
        categories_range: lodash.get(pricingLineControl.value, 'trip_pricing.categories_range'),
        isDisabled: this.data.isDisabled,
        apiRoute: this.data.apiRoute
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        pricingLineControl.get('trip_pricing').setValue({
          categories_range: result
        });
      }
    });
  }

  doAddPricingClient(pricingLineControl: AbstractControl): void {
    const dialogRef = this.dialog.open(PricingClientModalComponent, {
      dialogClass: 'modal-lg',
      data: {
        type: lodash.get(pricingLineControl.value, 'pricing_client.type'),
        percentage: lodash.get(pricingLineControl.value, 'pricing_client.percentage'),
        amount: lodash.get(pricingLineControl.value, 'pricing_client.amount'),
        currency: this.contractForm.get('currency').value,
        isDisabled: this.data.isDisabled,
        purchaseOrSale: this.data.purchaseOrSale,
        price_mode_default_activity_code: lodash.get(pricingLineControl.value, 'pricing_client.price_mode_default_activity_code')
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        pricingLineControl.get('pricing_client').setValue({
          type: result.type,
          percentage: result.percentage,
          amount: result.amount,
          currency: result.currency,
          price_mode_default_activity_code: result.price_mode_default_activity_code
        });
      }
    });
  }

  doAddPricingGrid(pricingLineControl: AbstractControl): void {
    const dialogRef = this.dialog.open(PricingGridModalComponent, {
      dialogClass: 'modal-lg',
      data: {
        vinOrTrip: this.contractForm.get('service_type').value,
        pricing_grid: lodash.get(pricingLineControl.value, 'pricing_grid'),
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

  doAddVinCategorieKmPrice(pricingLineControl: AbstractControl): void {
    const dialogRef = this.dialog.open(VinCategoryKmModalComponent, {
      dialogClass: 'modal-xl',
      data: {
        categories_km: lodash.get(pricingLineControl.value, 'vin_pricing.categories_km'),
        isDisabled: this.data.isDisabled,
        apiRoute: this.data.apiRoute
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        pricingLineControl.get('vin_pricing').setValue({
          categories_km: result
        });
      }
    });
  }

  doAddTripCategorieKmPrice(pricingLineControl: AbstractControl): void {
    const dialogRef = this.dialog.open(TripCategoryKmModalComponent, {
      dialogClass: 'modal-xl',
      data: {
        categories_km: lodash.get(pricingLineControl.value, 'trip_pricing.categories_km'),
        isDisabled: this.data.isDisabled,
        apiRoute: this.data.apiRoute
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        pricingLineControl.get('trip_pricing').setValue({
          categories_km: result
        });
      }
    });
  }

  drop(event: CdkDragDrop<string[]>, pricingLines: any[]): void {
    moveItemInArray(pricingLines, event.previousIndex, event.currentIndex);
  }

  resetPricingLines(): void {
    if (this.data.type === ContractType.TRSP_ROAD) {
      const serviceType = this.contractForm.get('service_type').value;
      if (serviceType === ServiceType.VIN) {
        this.versionsTransportTrip = this.contractForm.get('versions').value;
        (this.contractForm.get('versions') as UntypedFormArray)['controls'].splice(0);
        if (this.versionsTransportVin && this.versionsTransportVin.length !== 0) {
          this.versionsTransportVin.map((version) => this.doAddVersion(version));
        }
      } else if (serviceType === ServiceType.TRIP) {
        this.versionsTransportVin = this.contractForm.get('versions').value;
        (this.contractForm.get('versions') as UntypedFormArray)['controls'].splice(0);
        if (this.versionsTransportTrip && this.versionsTransportTrip.length !== 0) {
          this.versionsTransportTrip.map((version) => this.doAddVersion(version));
        }
      }
      this.changePricingFormulas(serviceType);
    }
  }

  private validateArrayLength(minLength: number): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => {
      let isVisible = false;
      if (this.contractForm) {
        isVisible = this.contractForm.get('mean_order').value;
      }
      if (isVisible) {
        return c.value.length < minLength ? { mean_order: true } : null;
      } else {
        return null;
      }
    };
  }

  private changePricingFormulas(serviceType: string): void {
    if (serviceType === ServiceType.VIN) {
      this.pricingFormulas = this.VIN_PRICING_FORMULAS;
    } else if (serviceType === ServiceType.TRIP) {
      this.pricingFormulas = this.TRIP_PRICING_FORMULAS;
    }
  }

  doEditDefaultDeparture(): void {
    const dialogRef = this.dialog.open(EditDefaultDepartureArrivalModalComponent, {
      dialogClass: 'modal-dialog-centered modal-lg',
      data: {
        type: 'departure',
        readOnly: this.data.isDisabled,
        data: this.contractForm.get('default_departure').value,
        apiRoute: this.data.apiRoute
      }
    });

    dialogRef.afterClosed().subscribe((data) => {
      if (data) {
        this.contractForm.get('default_departure').setValue(data);
      }
    });
  }

  doEditDefaultArrival(): void {
    const dialogRef = this.dialog.open(EditDefaultDepartureArrivalModalComponent, {
      dialogClass: 'modal-dialog-centered modal-lg',
      data: {
        type: 'arrival',
        readOnly: this.data.isDisabled,
        data: this.contractForm.get('default_arrival').value,
        apiRoute: this.data.apiRoute
      }
    });

    dialogRef.afterClosed().subscribe((data) => {
      if (data) {
        this.contractForm.get('default_arrival').setValue(data);
      }
    });
  }

  doEditDefaultSupplier(): void {
    const dialogRef = this.dialog.open(EditDefaultSubscriptionModalComponent, {
      dialogClass: 'modal-dialog-centered modal-lg',
      data: {
        type: 'supplier',
        readOnly: this.data.isDisabled,
        data: this.contractForm.get('default_supplier').value,
        apiRoute: this.data.apiRoute
      }
    });

    dialogRef.afterClosed().subscribe((data) => {
      if (data) {
        this.contractForm.get('default_supplier').setValue(data);
      }
    });
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
