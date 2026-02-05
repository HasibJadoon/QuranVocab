import { AfterViewInit, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { omit } from 'lodash';
import { interval, Subject, Subscription } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { McitDialogRef } from '../../../../dialog/dialog-ref';
import { McitDialog, MCIT_DIALOG_DATA } from '../../../../dialog/dialog.service';
import { McitCoreConfig, McitCoreEnv } from '../../../../helpers/provider.helper';
import { McitImportGridXlsxModalComponent } from '../../../../import-grid-xlsx-modal/import-grid-xlsx-modal.component';
import { McitPopupService } from '../../../../services/popup.service';
import { McitWaitingService } from '../../../../services/waiting.service';
import { IGrid, ITempGrid } from '../../../contract.model';
import { DispatcherApiRoutesEnum } from '../../../dispatcher-api-routes.domain';
import { GridImportStatus } from '../../../grid-import-status.domain';
import { ServiceType } from '../../../service-type.domain';
import { ContractsHttpService } from '../../../services/contracts-http.service';
import { GridsHttpService } from '../../../services/grids-http.service';

@Component({
  selector: 'mcit-pricing-grid-modal',
  templateUrl: './pricing-grid-modal.component.html',
  styleUrls: ['./pricing-grid-modal.component.scss']
})
export class PricingGridModalComponent implements OnInit, AfterViewInit, OnDestroy {
  pricingGrid: IGrid;
  newPricingGrid: ITempGrid;
  newPricingGridImported = false;
  progress: number;
  importInError = false;

  private refreshSubject = new Subject<boolean>();
  private subscriptions: Subscription[] = [];
  errorMessage: string;

  constructor(
    @Inject(MCIT_DIALOG_DATA)
    public modalData: {
      vinOrTrip: ServiceType;
      pricing_grid: IGrid;
      isDisabled: boolean;
      apiRoute: DispatcherApiRoutesEnum;
    },
    private dialogRef: McitDialogRef<PricingGridModalComponent>,
    private dialog: McitDialog,
    private contractsHttpService: ContractsHttpService,
    private env: McitCoreEnv,
    private config: McitCoreConfig,
    private waitingService: McitWaitingService,
    private popupService: McitPopupService,
    private gridsHttpService: GridsHttpService
  ) {
    this.pricingGrid = this.modalData.pricing_grid;
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.refreshSubject
        .asObservable()
        .pipe(
          filter((b) => b),
          switchMap(() => this.gridsHttpService.get(this.newPricingGrid._id))
        )
        .subscribe((updatedPricingGrid: ITempGrid) => {
          this.newPricingGrid = updatedPricingGrid;
          if (this.newPricingGrid.import_status === GridImportStatus.DONE) {
            if (this.newPricingGrid.number_of_duplicated_lines) {
              this.popupService.show('warning', 'IMPORT_PRICING_GRID.WARNING_DUPLICATE_LINES', {
                messageParams: { number_of_duplicated_lines: this.newPricingGrid.number_of_duplicated_lines }
              });
            }
            this.pricingGrid = omit(this.newPricingGrid, ['import_status', 'saved_lines_number', 'lines_to_save_number']);
            this.newPricingGrid = undefined;
            this.newPricingGridImported = true;
          } else if (this.newPricingGrid.import_status === GridImportStatus.SAVING_ENTRIES) {
            this.progress = Math.round((this.newPricingGrid.saved_lines_number / this.newPricingGrid.lines_to_save_number) * 100);
          } else if (this.newPricingGrid.import_status === GridImportStatus.ERROR) {
            this.errorMessage = this.newPricingGrid.error;
            this.newPricingGrid = undefined;
            this.importInError = true;
          }
        })
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.subscriptions.push(
        interval(5000).subscribe(() => {
          if (this.newPricingGrid) {
            this.refreshSubject.next(true);
          }
        })
      );
    }, 0);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  doUploadPricingGrid(): void {
    this.newPricingGridImported = false;
    const to = this.config.app === 'accounting' ? this.config.app : 'dispatcher';
    const dialogRefImport = this.dialog.open(McitImportGridXlsxModalComponent, {
      disableClose: false,
      dialogClass: 'modal-lg modal-dialog-centered',
      data: {
        serviceUploadEndpoint: `${this.env.apiUrl}/v2/${to}/contracts/pricing-grid/import`
      }
    });
    dialogRefImport.afterClosed().subscribe((result) => {
      if (result) {
        this.newPricingGrid = result;
        this.refreshSubject.next(true);
      }
    });
  }

  doDownloadPricingGrid(): void {
    this.waitingService.showWaiting();
    this.contractsHttpService.exportPricingGrid(this.pricingGrid).subscribe(
      (response) => {
        const type = 'application/ms-excel';
        const blob = new Blob([response.body], { type });
        const downloadLink = document.createElement('a');
        downloadLink.href = window.URL.createObjectURL(blob);
        downloadLink.setAttribute('download', this.pricingGrid.file_name ?? 'pricing_grid.xlsx');
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
    this.dialogRef.close(this.pricingGrid);
  }

  goBack(): void {
    this.dialogRef.close();
  }
}
