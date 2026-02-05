import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { RequestOrigin } from '@lib-shared/common/models/request-origin.domain';
import { IValuationTrspRoad, IToValorizationReport, ICfOrOpeOrWoValorizationReport, RelaunchValorizationReport } from '@lib-shared/common/models/valuate.model';
import { ValorizationActionsFilterEnum } from '@lib-shared/common/piloting/valorization-actions.domain';
import { ISingleTripValorizationReport } from '@lib-shared/common/piloting/statistic-trip-report.model';
import { environment } from '@lib-shared/common/piloting/environment';
import { CustomerFileValorizationRequest } from '@lib-shared/common/models/customer-file-valorization-request.model';
import { IPilotingWorkOrderSearchResponse } from '@lib-shared/common/models/work-order-contract.model';

@Injectable({
  providedIn: 'root'
})
export class ReplayHttpService {
  constructor(private http: HttpClient) {}

  valuateSingleToWithReport(toId: string, charterId: string, valoAction: ValorizationActionsFilterEnum, from: RequestOrigin = RequestOrigin.accounting): Observable<IToValorizationReport> {
    return this.http.patch<IToValorizationReport>(
      `${environment.apiUrl}/v2/accounting/debug/replay/transport-orders/valorization-single-with-report`,
      {
        valorizationActions: valoAction,
        to_id: toId
      },
      {
        params: {
          charter_id: charterId,
          from
        }
      }
    );
  }

  valorizeSingleTo(id: string, charterId: string): Observable<IValuationTrspRoad> {
    return this.http.patch<IValuationTrspRoad>(
      `${environment.apiUrl}/v2/accounting/debug/replay/transport-orders/valorization-single-to`,
      {
        id
      },
      {
        params: {
          charter_id: charterId
        }
      }
    );
  }

  searchSingleTo(id: string, charterId: string): Observable<IValuationTrspRoad> {
    return this.http.post<IValuationTrspRoad>(
      `${environment.apiUrl}/v2/accounting/debug/replay/transport-orders/search-single-to`,
      {
        id
      },
      {
        params: {
          charter_id: charterId
        }
      }
    );
  }

  showSingleTripReport(tripId: string, charterId: string, valoAction: ValorizationActionsFilterEnum, from: RequestOrigin = RequestOrigin.accounting): Observable<ISingleTripValorizationReport> {
    return this.http.patch<ISingleTripValorizationReport>(
      `${environment.apiUrl}/v2/accounting/debug/replay/trips/valorization-single-with-report`,
      {
        valorizationActions: valoAction,
        trip_id: tripId
      },
      {
        params: {
          charter_id: charterId,
          from
        }
      }
    );
  }

  valuateSingleTripWithReport(tripId: string, charterId: string, valoAction: ValorizationActionsFilterEnum, from: RequestOrigin = RequestOrigin.accounting): Observable<ISingleTripValorizationReport> {
    return this.http.patch<ISingleTripValorizationReport>(
      `${environment.apiUrl}/v2/accounting/debug/replay/trips/valorization-single-with-report`,
      {
        valorizationActions: valoAction,
        trip_id: tripId
      },
      {
        params: {
          charter_id: charterId,
          from
        }
      }
    );
  }

  revalorizeCustomerFile(customerFileValorizationReques: CustomerFileValorizationRequest, from: RequestOrigin = RequestOrigin.accounting): Observable<RelaunchValorizationReport> {
    return this.http.patch<RelaunchValorizationReport>(`${environment.apiUrl}/v2/accounting/debug/replay/customer-files/revalorize`, customerFileValorizationReques, {
      params: {
        from
      }
    });
  }

  valuateSingleOpeWithReport(operationNo: string, valoAction: ValorizationActionsFilterEnum, from: RequestOrigin = RequestOrigin.accounting): Observable<ICfOrOpeOrWoValorizationReport> {
    return this.http.patch<ICfOrOpeOrWoValorizationReport>(
      `${environment.apiUrl}/v2/accounting/debug/replay/operation-transport/valorization-single-with-report`,
      {
        valorization_action: valoAction,
        operation_no: operationNo
      },
      {
        params: {
          from
        }
      }
    );
  }

  valuateSingleWoWithReport(workOrderNo: string, from: RequestOrigin = RequestOrigin.accounting): Observable<IPilotingWorkOrderSearchResponse> {
    return this.http.patch<IPilotingWorkOrderSearchResponse>(
      `${environment.apiUrl}/v2/accounting/debug/replay/only-work-orders/valorization-single-with-report`,
      {
        work_order_no: workOrderNo
      },
      {
        params: {
          from
        }
      }
    );
  }
}
