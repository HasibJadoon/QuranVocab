import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { KeyValuePipe } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { McitMeaningPipe } from '@lib-shared/common/common/pipes/meaning.pipe';
import { IContractVersion } from '@lib-shared/common/contract/contract-version.model';
import { IContract, IContractVersionRef } from '@lib-shared/common/contract/contract.model';
import { ServicesFormula, SERVICES_FORMULAS } from '@lib-shared/common/contract/services-formula.domain';
import { ContractsHttpService } from '@lib-shared/common/contract/services/contracts-http.service';
import { McitDialogRef } from '@lib-shared/common/dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '@lib-shared/common/dialog/dialog.service';
import { IServiceRef } from '@lib-shared/common/inspection/inspection.model';
import { McitPopupService } from '@lib-shared/common/services/popup.service';
import { McitWaitingService } from '@lib-shared/common/services/waiting.service';
import { set } from 'lodash';
import { Observable, Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { ContractType } from '../../contract.domain';
import { IServicesGridModalData } from '../services-grid-modal/services-grid-modal.component';
import { ServicesGridModalService } from '../services-grid-modal/services-grid-modal.service';

@Component({
  selector: 'mcit-add-edit-additional-services-contracts-modal',
  templateUrl: './add-edit-additional-services-modal.component.html',
  styleUrls: ['./add-edit-additional-services-modal.component.scss'],
  providers: [McitMeaningPipe, KeyValuePipe]
})
export class AddEditAdditionalServicesModalComponent implements OnInit, OnDestroy {
  destroy$: Subject<boolean> = new Subject<boolean>();
  contract: IContract;
  isDisabled = true;
  data: { id: string; isEditForm: boolean; owner: string } = {
    id: null,
    isEditForm: false,
    owner: null
  };
  servicesForm: UntypedFormGroup;
  version: IContractVersion;
  versionsRef: IContractVersionRef[];
  versions = [];

  currentThirdPartyId: string;

  dataSource: Observable<IServiceRef[]>;
  loadingServices = false;

  servicesFormulas: string[] = SERVICES_FORMULAS;

  constructor(
    @Inject(MCIT_DIALOG_DATA) modalData: any,
    private dialogRef: McitDialogRef<AddEditAdditionalServicesModalComponent>,
    private waitingService: McitWaitingService,
    private contractsHttpService: ContractsHttpService,
    private popupService: McitPopupService,
    private formBuilder: UntypedFormBuilder,
    private servicesGridModalService: ServicesGridModalService
  ) {
    this.data = Object.assign(this.data, modalData);
    this.servicesForm = this.formBuilder.group({
      version_id: [''],
      service_lines: this.formBuilder.array([])
    });
    this.waitingService.showWaiting();

    this.contractsHttpService
      .getContract(this.data.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        async (contract: IContract) => {
          this.contract = contract;
          this.versionsRef = contract[this.getVersionsKey(contract.type)]?.versions;
          if (!Array.isArray(this.versionsRef) || this.versionsRef.length === 0) {
            this.popupService.show('warning', 'COMMON_CONTRACTS.INSPECTIONS_MODAL.WARNING_CONTRAT_VERSION_NOT_EXIST');
            this.dialogRef.close();
          } else {
            for (const version of this.versionsRef) {
              this.versions.push(await this.contractsHttpService.getContractVersion(version._id).toPromise());
            }
            this.servicesForm.get('version_id').patchValue(this.versionsRef[this.versionsRef.length - 1]._id);
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

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  ngOnInit(): void {
    this.servicesForm
      .get('version_id')
      .valueChanges.pipe(
        tap((versionId) => {
          if (versionId) {
            this.isDisabled = false;
            this.deleteAllServices();
            const selectedVersion = this.versions.find((v) => v._id === versionId);
            selectedVersion[this.getVersionsKey(this.contract.type)]?.service_lines?.forEach((sl) => this.doAddServiceLine(sl));
          }
        })
      )
      .subscribe();
    this.currentThirdPartyId = this.data.owner;
  }

  getVersionsKey(contracType: ContractType): string {
    let versionsKey = contracType.toLowerCase();
    if (contracType === ContractType.TRSP_ROAD) {
      versionsKey = 'transport_road';
    }
    return versionsKey;
  }

  doAddServices(formula: ServicesFormula, pricingLineControl: AbstractControl): void {
    if (formula === ServicesFormula.SERVICES_GRID) {
      this.doAddServicesGrid(pricingLineControl);
    }
  }

  doAddServicesGrid(servicesLineControl: AbstractControl): void {
    const data: IServicesGridModalData = {
      servicesGrid: servicesLineControl.value?.services_grid,
      isServiceContract: this.contract.type === ContractType.SERVICE
    };
    this.servicesGridModalService.showModal(data).subscribe((result) => {
      if (result) {
        servicesLineControl.get('services_grid').setValue(result);
      }
    });
  }

  drop(event: CdkDragDrop<string[]>, services: any[]): void {
    moveItemInArray(services, event.previousIndex, event.currentIndex);
  }

  doSave(): void {
    if (!this.servicesForm.valid) {
      return;
    }
    const form = this.servicesForm.getRawValue();
    const version_id = form.version_id;
    const version = this.versions.find((v) => v._id === version_id);
    const obj: IContractVersion = {
      _id: version_id,
      contract_type: version.contract_type,
      transport: version.transport,
      means_road: version.means_road
    };
    const serviceLines = [];
    if (form.service_lines.length > 0) {
      form.service_lines.forEach((line) => {
        if (line.formula === ServicesFormula.SERVICES_GRID) {
          serviceLines.push(line);
        }
      });
    }
    set(obj, `${this.getVersionsKey(this.contract.type)}.service_lines`, serviceLines);
    this.updateVersion(obj);
  }

  private updateVersion(version: IContractVersion): void {
    this.waitingService.showWaiting();
    this.contractsHttpService.updateVersion(version).subscribe(
      () => {
        this.waitingService.hideWaiting();
        this.popupService.showSuccess('COMMON_CONTRACTS.MODAL.EDIT_TRANSPORT_SUCCESS');
        this.dialogRef.close(version._id);
      },
      (err) => {
        this.waitingService.hideWaiting();
        if (err.status === 409) {
          this.popupService.showError('COMMON_CONTRACTS.MODAL.ALREADY_EXIST');
        } else {
          this.popupService.showError();
        }
      }
    );
  }

  goBack(): void {
    this.dialogRef.close();
  }

  private deleteAllServices(): void {
    const formArray = this.servicesForm.get('service_lines') as UntypedFormArray;
    while (formArray.length !== 0) {
      formArray.removeAt(0);
    }
  }

  doAddServiceLine(serviceLine?: IServiceRef): void {
    const servicesControl = this.servicesForm.get('service_lines') as UntypedFormArray;
    const newService = this.formBuilder.group({
      formula: this.servicesFormulas[1], // V1 : Uniquement des services_grid
      services_grid: [[]]
    });
    servicesControl.push(newService);
    if (serviceLine) {
      const contractServiceLine = serviceLine as any;
      newService.patchValue({
        formula: this.servicesFormulas[1],
        services_grid: contractServiceLine.services_grid || {}
      });
    } else {
      newService.patchValue({ formula: this.servicesFormulas[1] });
    }
  }

  doDeleteServicesLine(indexLine: number): void {
    (this.servicesForm.get('service_lines') as UntypedFormArray).removeAt(indexLine);
  }
}
