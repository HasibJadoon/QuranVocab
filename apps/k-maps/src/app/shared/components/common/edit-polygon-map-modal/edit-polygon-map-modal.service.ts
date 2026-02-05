import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../dialog/dialog.service';
import { McitEditPolygonMapModalComponent } from './edit-polygon-map-modal.component';
import { IGeometryCollection, IGeoposition } from '../models/types.model';
import { map } from 'rxjs/operators';

@Injectable()
export class McitEditPolygonMapModalService {
  constructor(private dialog: McitDialog) {}

  editPolygonMap(center?: IGeoposition, area?: IGeometryCollection): Observable<{ area: IGeometryCollection }> {
    const ref = this.dialog.open(McitEditPolygonMapModalComponent, {
      dialogClass: 'modal-lg',
      data: {
        center:
          center != null
            ? {
                lat: center.latitude,
                lng: center.longitude
              }
            : null,
        polygons: area?.geometries
      }
    });
    return ref.afterClosed().pipe(
      map((next) =>
        next != null
          ? {
              area:
                next.polygons != null
                  ? {
                      type: 'GeometryCollection',
                      geometries: next.polygons
                    }
                  : null
            }
          : null
      )
    );
  }
}
