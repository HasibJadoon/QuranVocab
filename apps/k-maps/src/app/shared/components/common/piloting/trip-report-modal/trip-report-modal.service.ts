import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '@lib-shared/common/dialog/dialog.service';
import { TripReportModalComponent } from './trip-report-modal.component';
import { IValuateResultTrip } from '../statistic-trip-report.model';

@Injectable()
export class TripReportModalService {
  constructor(private dialog: McitDialog) {}

  showTripReportModal(valuateResultTrip: IValuateResultTrip): Observable<void> {
    return this.dialog
      .open<TripReportModalComponent, { valuateResultTrip: IValuateResultTrip }, void>(TripReportModalComponent, {
        dialogClass: 'modal-xl',
        data: { valuateResultTrip }
      })
      .afterClosed();
  }
}
