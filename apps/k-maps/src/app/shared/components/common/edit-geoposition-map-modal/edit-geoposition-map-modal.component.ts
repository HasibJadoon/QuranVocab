import { Component, Inject, OnInit } from '@angular/core';
import * as lodash from 'lodash';
import { catchError, filter, map } from 'rxjs/operators';
import { of } from 'rxjs';
import * as MapboxGl from 'mapbox-gl';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';
import { PlacesHttpService } from '../services/places-http.service';

@Component({
  selector: 'mcit-edit-geoposition-map-modal',
  templateUrl: './edit-geoposition-map-modal.component.html',
  styleUrls: ['./edit-geoposition-map-modal.component.scss']
})
export class McitEditGeopositionMapModalComponent implements OnInit {
  name: string;
  place: any;
  marker: MapboxGl.Marker;

  constructor(
    private dialogRef: McitDialogRef<McitEditGeopositionMapModalComponent>,
    @Inject(MCIT_DIALOG_DATA)
    private data: {
      position?: { name: string; lat: number; lng: number };
    },
    private placesHttpService: PlacesHttpService
  ) {}

  ngOnInit(): void {}

  doLoadedMap(mapContainer: MapboxGl.Map): void {
    mapContainer.addControl(
      new MapboxGl.NavigationControl({
        showCompass: true,
        visualizePitch: true,
        showZoom: true
      })
    );

    this.marker = new MapboxGl.Marker({
      draggable: true
    })
      .setLngLat([0, 0])
      .addTo(mapContainer);
    this.marker.getElement().style.visibility = 'hidden';

    if (this.data.position != null) {
      this.name = this.data.position.name ?? `${this.data.position.lat},${this.data.position.lng}`;
      this.update(this.data.position.lng, this.data.position.lat, false);

      mapContainer.fitBounds(
        [
          [this.data.position.lng, this.data.position.lat],
          [this.data.position.lng, this.data.position.lat]
        ],
        { maxZoom: 4 }
      );
    }

    let timeoutId = null;
    mapContainer.on('mousedown', (e) => {
      timeoutId = setTimeout(() => {
        timeoutId = null;
        this.update(e.lngLat.lng, e.lngLat.lat, true);
      }, 1000);
    });
    mapContainer.on('move', (e) => {
      if (timeoutId != null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    });
    mapContainer.on('mouseup', (e) => {
      if (timeoutId != null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    });
    this.marker.on('drag', () => {
      if (timeoutId != null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    });
    this.marker.on('dragend', () => {
      const lngLat = this.marker.getLngLat();
      this.update(lngLat.lng, lngLat.lat, true);
    });
  }

  private update(lng: number, lat: number, searchName: boolean): void {
    this.marker.setLngLat([lng, lat]);
    this.marker.getElement().style.visibility = 'visible';

    if (searchName) {
      this.name = null;
      this.place = null;
      this.placesHttpService
        .reverse({ lat, lng }, true)
        .pipe(
          map((res) => lodash.head(res)),
          catchError(() => of(null)),
          filter((res) => res != null)
        )
        .subscribe((next) => {
          this.name = next.name ?? `${lat},${lng}`;

          if (next.place_id != null) {
            this.placesHttpService
              .detail(next.place_id)
              .pipe(
                catchError(() => of(null)),
                filter((res) => res != null)
              )
              .subscribe((next2) => {
                this.place = next2;
              });
          }
        });
    }
  }

  doClose(): void {
    this.dialogRef.close();
  }

  doSelect(): void {
    const lngLat = this.marker.getLngLat();
    this.dialogRef.close({
      place: this.place,
      lat: lngLat.lat,
      lng: lngLat.lng
    });
  }
}
