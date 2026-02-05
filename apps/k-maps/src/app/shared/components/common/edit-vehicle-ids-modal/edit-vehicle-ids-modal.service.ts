import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../dialog/dialog.service';
import * as lodash from 'lodash';
import { McitEditVehicleIdsModalComponent } from './edit-vehicle-ids-modal.component';
import { ParkStructureSquare } from 'projects/compound/src/app/business/models/park-structure.model';

export interface IVehicleId {
  vin?: string;
  x_vin?: string;
  license_plate?: string;
  maker?: string;
  model?: string;
}

export interface IOptions {
  disableClose?: boolean;
  dialogClass?: string;
  disableVin?: boolean;
  disableXVin?: boolean;
  disableLicensePlate?: boolean;
  disableMaker?: boolean;
  disableModel?: boolean;
  titleKey?: string;
}

@Injectable()
export class McitEditVehicleIdsModalService {
  constructor(private dialog: McitDialog) {}

  editVehicleIds(vehicleIds: IVehicleId[], options?: IOptions, displayRefs?: boolean, isDisabled?: boolean): Observable<IVehicleId[]> {
    const ref = this.dialog.open<McitEditVehicleIdsModalComponent, any, IVehicleId[]>(McitEditVehicleIdsModalComponent, {
      dialogClass: lodash.get(options, 'dialogClass', 'modal-xl'),
      disableClose: lodash.get(options, 'disableClose', true),
      data: {
        vehicleIds,
        options,
        displayRefs,
        isDisabled
      }
    });
    return ref.afterClosed();
  }

  editParkDescriptionSquares(squares: ParkStructureSquare[], options?: IOptions, displayRefs?: boolean, isDisabled?: boolean): Observable<ParkStructureSquare[]> {
    const ref = this.dialog.open<McitEditVehicleIdsModalComponent, any, ParkStructureSquare[]>(McitEditVehicleIdsModalComponent, {
      dialogClass: lodash.get(options, 'dialogClass', 'modal-xl'),
      disableClose: lodash.get(options, 'disableClose', true),
      data: {
        squares,
        options,
        displayRefs,
        isDisabled
      }
    });
    return ref.afterClosed();
  }
}
