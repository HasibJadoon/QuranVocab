import { AfterViewInit, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { omit } from 'lodash';
import { interval, Subject, Subscription } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { McitDialogRef } from '../../../dialog/dialog-ref';
import { McitDialog, MCIT_DIALOG_DATA } from '../../../dialog/dialog.service';
import { McitCoreConfig, McitCoreEnv } from '../../../helpers/provider.helper';
import { McitImportGridXlsxModalComponent } from '../../../import-grid-xlsx-modal/import-grid-xlsx-modal.component';
import { McitPopupService } from '../../../services/popup.service';
import { McitWaitingService } from '../../../services/waiting.service';
import { IGrid, ITempGrid } from '../../contract.model';
import { GridImportStatus } from '../../grid-import-status.domain';
import { ContractsHttpService } from '../../services/contracts-http.service';
import { GridsHttpService } from '../../services/grids-http.service';

export interface IServicesGridModalData {
  servicesGrid?: IGrid;
  isServiceContract?: boolean;
}

@Component({
  selector: 'mcit-services-grid-modal',
  templateUrl: './services-grid-modal.component.html',
  styleUrls: ['./services-grid-modal.component.scss']
})
export class ServicesGridModalComponent implements OnInit, AfterViewInit, OnDestroy {
  servicesGrid: IGrid;
  newServicesGrid: ITempGrid;
  newServicesGridImported = false;
  progress: number;
  serviceUploadEndpoint: string;
  modalDescription = 'COMMON_CONTRACTS.MODAL.SERVICES_GRID_MODAL.LIGHT_DESCRIPTION';
  importInError = false;
  errorMessage: string;

  private refreshSubject = new Subject<boolean>();
  private subscriptions: Subscription[] = [];
  private isServiceContract: boolean;

  constructor(
    @Inject(MCIT_DIALOG_DATA) public modalData: IServicesGridModalData,
    private dialogRef: McitDialogRef<ServicesGridModalComponent>,
    private dialog: McitDialog,
    private contractsHttpService: ContractsHttpService,
    private popupService: McitPopupService,
    private env: McitCoreEnv,
    private config: McitCoreConfig,
    private waitingService: McitWaitingService,
    private gridsHttpService: GridsHttpService
  ) {
    this.servicesGrid = this.modalData.servicesGrid;
    this.isServiceContract = this.modalData.isServiceContract;
    if (this.isServiceContract) {
      this.modalDescription = 'COMMON_CONTRACTS.MODAL.SERVICES_GRID_MODAL.SERVICE_CONTRACT_DESCRIPTION';
    }
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.refreshSubject
        .asObservable()
        .pipe(
          filter((b) => b),
          switchMap(() => this.gridsHttpService.get(this.newServicesGrid._id))
        )
        .subscribe((updatedServicesGrid: ITempGrid) => {
          this.newServicesGrid = updatedServicesGrid;
          if (this.newServicesGrid.import_status === GridImportStatus.DONE) {
            if (this.newServicesGrid.number_of_duplicated_lines) {
              this.popupService.show('warning', 'IMPORT_PRICING_GRID.WARNING_DUPLICATE_LINES', {
                messageParams: { number_of_duplicated_lines: this.newServicesGrid.number_of_duplicated_lines }
              });
            }
            this.servicesGrid = omit(this.newServicesGrid, ['import_status', 'saved_lines_number', 'lines_to_save_number']);
            this.newServicesGrid = undefined;
            this.newServicesGridImported = true;
          } else if (this.newServicesGrid.import_status === GridImportStatus.SAVING_ENTRIES) {
            this.progress = Math.round((this.newServicesGrid.saved_lines_number / this.newServicesGrid.lines_to_save_number) * 100);
          } else if (this.newServicesGrid.import_status === GridImportStatus.ERROR) {
            this.errorMessage = this.newServicesGrid.error;
            this.newServicesGrid = undefined;
            this.importInError = true;
          }
        })
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.subscriptions.push(
        interval(5000).subscribe(() => {
          if (this.newServicesGrid) {
            this.refreshSubject.next(true);
          }
        })
      );
    }, 0);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  doUploadServicesGrid(): void {
    this.newServicesGridImported = false;
    const to = this.config.app === 'accounting' ? this.config.app : 'dispatcher';
    const dialogRefImport = this.dialog.open(McitImportGridXlsxModalComponent, {
      disableClose: false,
      dialogClass: 'modal-lg modal-dialog-centered',
      data: {
        serviceUploadEndpoint: `${this.env.apiUrl}/v2/${to}/contracts/services-grid/import/${this.isServiceContract}`,
        description: 'COMMON_CONTRACTS.MODAL.SERVICES_GRID_MODAL.IMPORT_SERVICES_GRID_DESCRIPTION'
      }
    });
    dialogRefImport.afterClosed().subscribe((result) => {
      if (result) {
        this.newServicesGrid = result;
        this.refreshSubject.next(true);
      }
    });
  }

  doDownloadServicesGrid(): void {
    this.waitingService.showWaiting();
    this.contractsHttpService.exportServicesGrid(this.servicesGrid, this.isServiceContract).subscribe(
      (response) => {
        const type = 'application/ms-excel';
        const blob = new Blob([response.body], { type });
        const downloadLink = document.createElement('a');
        downloadLink.href = window.URL.createObjectURL(blob);
        downloadLink.setAttribute('download', this.servicesGrid.file_name ?? 'services_grid.xlsx');
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        this.waitingService.hideWaiting();
      },
      () => {
        this.waitingService.hideWaiting();
        this.popupService.showError();
      }
    );
  }

  doSave(): void {
    this.dialogRef.close(this.servicesGrid);
  }

  goBack(): void {
    this.dialogRef.close();
  }
}
