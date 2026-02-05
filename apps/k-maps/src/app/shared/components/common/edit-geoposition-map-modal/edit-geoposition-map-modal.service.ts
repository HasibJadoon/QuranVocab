import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../dialog/dialog.service';
import { McitEditGeopositionMapModalComponent } from './edit-geoposition-map-modal.component';
import { IGeoposition } from '../models/types.model';
import { map } from 'rxjs/operators';

@Injectable()
export class McitEditGeopositionMapModalService {
  constructor(private dialog: McitDialog) {}

  editGeopositionMap(geoposition: IGeoposition): Observable<{ geoposition: IGeoposition; place: any }> {
    const ref = this.dialog.open(McitEditGeopositionMapModalComponent, {
      dialogClass: 'modal-lg',
      data: {
        position: geoposition
          ? {
              lat: geoposition.latitude,
              lng: geoposition.longitude
            }
          : null
      }
    });
    return ref.afterClosed().pipe(
      map((next) =>
        next != null
          ? {
              geoposition: {
                latitude: next.lat,
                longitude: next.lng,
                geo: {
                  type: 'Point',
                  coordinates: [next.lng, next.lat]
                }
              },
              place: next.place
            }
          : null
      )
    );
  }
}
