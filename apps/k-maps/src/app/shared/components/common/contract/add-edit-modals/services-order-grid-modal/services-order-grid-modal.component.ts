import { AfterViewInit, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { omit } from 'lodash';
import { from, interval, Observable, of, Subject, Subscription } from 'rxjs';
import { concatMap, filter, mergeMap, switchMap } from 'rxjs/operators';
import { McitDialogRef } from '../../../dialog/dialog-ref';
import { MCIT_DIALOG_DATA, McitDialog } from '../../../dialog/dialog.service';
import { McitPopupService } from '../../../services/popup.service';
import { IGrid, ITempGrid } from '../../contract.model';
import { GridImportStatus } from '../../grid-import-status.domain';
import { GridsHttpService } from '../../services/grids-http.service';
import { McitWaitingService } from '@lib-shared/common/services/waiting.service';
import { ContractsHttpService } from '../../services/contracts-http.service';
import { McitCoreConfig, McitCoreEnv } from '@lib-shared/common/helpers/provider.helper';
import { McitImportGridXlsxModalComponent } from '@lib-shared/common/import-grid-xlsx-modal/import-grid-xlsx-modal.component';

export interface IServicesOrderGridModalData {
  servicesWorkOrdersGrid?: IGrid;
  contractId?: string;
  versionDates?: [string, string];
}

@Component({
  selector: 'mcit-services-grid-modal',
  templateUrl: './services-order-grid-modal.component.html',
  styleUrls: ['./services-order-grid-modal.component.scss']
})
export class ServicesOrderGridModalComponent implements OnInit, AfterViewInit, OnDestroy {
  servicesWorkOrdersGrid: IGrid;
  newServicesWorkOrdersGrid: ITempGrid;
  newServicesWorkOrdersGridImported = false;
  progress: number;
  serviceUploadEndpoint: string;
  modalDescription = 'COMMON_CONTRACTS.MODAL.SERVICES_ORDER_GRID_MODAL.DESCRIPTION';
  importInError = false;
  errorMessage: string;
  contractId: string;

  versionStart: string;
  versionEnd: string;

  private refreshSubject = new Subject<boolean>();
  private subscriptions: Subscription[] = [];

  constructor(
    @Inject(MCIT_DIALOG_DATA) public modalData: IServicesOrderGridModalData,
    private dialogRef: McitDialogRef<ServicesOrderGridModalComponent>,
    private dialog: McitDialog,
    private popupService: McitPopupService,
    private gridsHttpService: GridsHttpService,
    private waitingService: McitWaitingService,
    private contractsHttpService: ContractsHttpService,
    private env: McitCoreEnv,
    private config: McitCoreConfig
  ) {
    this.servicesWorkOrdersGrid = this.modalData.servicesWorkOrdersGrid;
    this.contractId = this.modalData.contractId;
    this.versionStart = this.modalData.versionDates[0];
    this.versionEnd = this.modalData.versionDates[1];
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.refreshSubject
        .asObservable()
        .pipe(
          filter((b) => b),
          switchMap(() => this.gridsHttpService.get(this.newServicesWorkOrdersGrid._id))
        )
        .subscribe((updatedServicesGrid: ITempGrid) => {
          this.newServicesWorkOrdersGrid = updatedServicesGrid;
          if (this.newServicesWorkOrdersGrid.import_status === GridImportStatus.DONE) {
            if (this.newServicesWorkOrdersGrid.number_of_duplicated_lines) {
              this.popupService.show('warning', 'IMPORT_PRICING_GRID.WARNING_DUPLICATE_LINES', {
                messageParams: { number_of_duplicated_lines: this.newServicesWorkOrdersGrid.number_of_duplicated_lines }
              });
            }
            this.servicesWorkOrdersGrid = omit(this.newServicesWorkOrdersGrid, ['import_status', 'saved_lines_number', 'lines_to_save_number']);
            this.newServicesWorkOrdersGrid = undefined;
            this.newServicesWorkOrdersGridImported = true;
          } else if (this.newServicesWorkOrdersGrid.import_status === GridImportStatus.SAVING_ENTRIES) {
            this.progress = Math.round((this.newServicesWorkOrdersGrid.saved_lines_number / this.newServicesWorkOrdersGrid.lines_to_save_number) * 100);
          } else if (this.newServicesWorkOrdersGrid.import_status === GridImportStatus.ERROR) {
            this.errorMessage = this.newServicesWorkOrdersGrid.error;
            this.newServicesWorkOrdersGrid = undefined;
            this.importInError = true;
          }
        })
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.subscriptions.push(
        interval(5000).subscribe(() => {
          if (this.newServicesWorkOrdersGrid) {
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
    this.newServicesWorkOrdersGridImported = false;
    const to = this.config.app;
    const dialogRefImport = this.dialog.open(McitImportGridXlsxModalComponent, {
      disableClose: false,
      dialogClass: 'modal-lg modal-dialog-centered',
      data: {
        serviceUploadEndpoint: `${this.env.apiUrl}/v2/${to}/contracts/services-work-orders-grid/import?id=${this.contractId}&versionStart=${this.versionStart}&versionEnd=${this.versionEnd}`,
        description: 'COMMON_CONTRACTS.MODAL.SERVICES_GRID_MODAL.IMPORT_SERVICES_GRID_DESCRIPTION'
      }
    });
    dialogRefImport.afterClosed().subscribe((result) => {
      if (result) {
        this.newServicesWorkOrdersGrid = result;
        this.refreshSubject.next(true);
      }
    });
  }

  doDownloadServicesGrid(): void {
    this.waitingService.showWaiting();
    this.contractsHttpService.exportServicesWorkOrdersGrid(this.servicesWorkOrdersGrid).subscribe(
      (response) => {
        const type = 'application/ms-excel';
        const blob = new Blob([response.body], { type });
        const downloadLink = document.createElement('a');
        downloadLink.href = window.URL.createObjectURL(blob);
        downloadLink.setAttribute('download', this.servicesWorkOrdersGrid.file_name ?? 'WO_grid.xlsx');
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
    this.dialogRef.close(this.servicesWorkOrdersGrid);
  }

  goBack(): void {
    this.dialogRef.close();
  }
}
