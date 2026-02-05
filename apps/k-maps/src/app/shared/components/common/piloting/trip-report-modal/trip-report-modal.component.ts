import { Component, Inject, OnInit } from '@angular/core';
import { McitDialogRef } from '@lib-shared/common/dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '@lib-shared/common/dialog/dialog.service';
import { ITrip } from '@lib-shared/common/models/trip.model';
import { ColumnType, ITableOptions } from '@lib-shared/common/table/table-options';
import { IContract } from '@lib-shared/common/contract/contract.model';
import { IThirdParty } from '@lib-shared/common/third-party/third-party.model';
import { ThirdPartiesHttpService } from '@lib-shared/common/contract/services/third-parties-http.service';
import { ContractsHttpService } from '@lib-shared/common/contract/services/contracts-http.service';
import { IValuateResultTrip } from '@lib-shared/common/piloting/statistic-trip-report.model';
import { IValuationTrspRoad } from '@lib-shared/common/piloting/valuate.model';

@Component({
  selector: 'app-trip-report-modal',
  templateUrl: './trip-report-modal.component.html',
  styleUrls: ['./trip-report-modal.component.scss']
})
export class TripReportModalComponent implements OnInit {
  oldTrip: Partial<ITrip>;
  trip: Partial<ITrip>;
  valuationTrspRoad: IValuationTrspRoad;
  contractOnSameRankError: string[];

  currency: string;

  contractsSameSupplier: IValuationTrspRoad[];
  contractsAllSupplier: IValuationTrspRoad[];
  tableContracts: ITableOptions<IValuationTrspRoad>;

  charter: IThirdParty;
  supplier: IThirdParty;
  tripContract: IContract;
  oldTripContract: IContract;

  constructor(
    private dialogRef: McitDialogRef<TripReportModalComponent>,
    @Inject(MCIT_DIALOG_DATA)
    data: {
      valuateResultTrip: IValuateResultTrip;
    },
    private thirdPartiesHttpService: ThirdPartiesHttpService,
    private contractsHttpService: ContractsHttpService
  ) {
    this.oldTrip = data.valuateResultTrip.oldTrip;
    this.trip = data.valuateResultTrip.trip;
    this.valuationTrspRoad = data.valuateResultTrip.valuationTrspRoad;
    this.contractOnSameRankError = data.valuateResultTrip.contracts.sameRankError;
    this.contractsSameSupplier = Object.values(data.valuateResultTrip.contracts?.t1 ?? [])?.flat();
    this.contractsAllSupplier = Object.values(data.valuateResultTrip.contracts?.t2 ?? [])?.flat();

    this.currency = this.trip.contract_trsp?.currency;
  }

  ngOnInit(): void {
    this.tableContracts = this.emplaceTableOptions();
    this.thirdPartiesHttpService.get(this.trip.charter_id).subscribe((thirdParty) => (this.charter = thirdParty));
    this.thirdPartiesHttpService.get(this.trip.supplier?.supplier_id).subscribe((thirdParty) => (this.supplier = thirdParty));
    this.contractsHttpService.getContractForPiloting(this.trip.contract_trsp?.contract_trsp_id).subscribe((contract) => (this.tripContract = contract));
    this.contractsHttpService.getContractForPiloting(this.oldTrip.contract_trsp?.contract_trsp_id).subscribe((contract) => (this.oldTripContract = contract));
  }

  doClose(): void {
    this.dialogRef.close();
  }

  private emplaceTableOptions(): ITableOptions<IValuationTrspRoad> {
    return {
      save: {
        id: '_id'
      },
      config: {
        textSize: 'small'
      },
      row: {
        trackBy: (item) => item.contract._id,
        cssClass: (item) => {
          if (this.contractOnSameRankError?.includes(item.contract.code)) {
            return 'error';
          }
          if (item.contract.code === this.valuationTrspRoad?.contract?.code) {
            return 'success';
          }
          if (!item.pricings?.root?.calculated_price) {
            return 'font-italic';
          }
          return '';
        }
      },
      columns: {
        columnsConfig: {
          name: {
            nameKey: 'PILOTING_COMPONENT.TRIP_REPORT_MODAL.TAB_COLUMNS.CONTRACT',
            type: ColumnType.text,
            text: {
              value: (item) => `${item.contract.name} (${item.contract.code})`
            }
          },
          service_type: {
            nameKey: 'PILOTING_COMPONENT.TRIP_REPORT_MODAL.TAB_COLUMNS.SERVICE_TYPE',
            type: ColumnType.text,
            text: {
              value: (item) => item.contract.transport_road?.service_type
            }
          },
          rank: {
            nameKey: 'PILOTING_COMPONENT.TRIP_REPORT_MODAL.TAB_COLUMNS.RANK',
            type: ColumnType.text,
            text: {
              value: (item) => item.contract.transport_road?.rank?.toString()
            }
          },
          price: {
            nameKey: 'PILOTING_COMPONENT.TRIP_REPORT_MODAL.TAB_COLUMNS.PRICE',
            type: ColumnType.custom,
            custom: {
              value: 'price'
            }
          }
        }
      }
    };
  }
}
