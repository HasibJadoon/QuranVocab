import { Component, Inject } from '@angular/core';
import { McitDialogRef } from '../../../../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../../../../dialog/dialog.service';
import { McitDistancePipe } from '../../../../common/pipes/distance.pipe';
import { PlacesHttpService } from '../../../../services/places-http.service';
import * as lodash from 'lodash';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import * as MapboxGl from 'mapbox-gl';
import { GeoJSONSource } from 'mapbox-gl';
import { metersToPixelsAtMaxZoom } from '@lib-shared/common/helpers/map.helper';
import { McitDistanceService } from '@lib-shared/common/services/distance.service';

@Component({
  selector: 'mcit-category-geo-distance-modal',
  templateUrl: './filter-geo-within-modal.component.html',
  styleUrls: ['./filter-geo-within-modal.component.scss'],
  providers: [McitDistancePipe]
})
export class McitFilterGeoWithinModalComponent {
  name: string;
  marker: MapboxGl.Marker;

  constructor(
    private dialogRef: McitDialogRef<McitFilterGeoWithinModalComponent>,
    @Inject(MCIT_DIALOG_DATA)
    private data: {
      position?: { name: string; lat: number; lng: number };
      radius?: number;
    },
    private distancePipe: McitDistancePipe,
    private distanceService: McitDistanceService,
    private placesHttpService: PlacesHttpService
  ) {}

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

    if (this.data.radius != null) {
      mapContainer.addSource(`source_radius`, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [0, 0]
          },
          properties: {}
        }
      });

      mapContainer.addLayer({
        id: `circle_radius`,
        type: 'circle',
        source: `source_radius`,
        layout: {
          visibility: 'none'
        },
        paint: {
          'circle-radius': {
            stops: [
              [0, 0],
              [20, metersToPixelsAtMaxZoom(this.distanceService.toKm(this.data.radius) * 1000, 0)]
            ],
            base: 2
          },
          'circle-color': '#000000',
          'circle-opacity': 0.05,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#000000',
          'circle-stroke-opacity': 0.6
        }
      });

      mapContainer.addLayer({
        id: `label_radius`,
        type: 'symbol',
        source: `source_radius`,
        maxzoom: 20,
        minzoom: 1,
        layout: {
          'text-field': this.distancePipe.transform(this.data.radius * 1000),
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
          'text-variable-anchor': ['top'],
          'text-ignore-placement': true,
          visibility: 'none'
        },
        paint: {
          'text-color': 'rgba(0,0,0,0.6)',
          'text-translate': {
            stops: [
              [0, [0, 0]],
              [20, [0, metersToPixelsAtMaxZoom(this.distanceService.toKm(this.data.radius) * 1000, 0)]]
            ],
            base: 2
          } as any,
          'text-translate-anchor': 'viewport',
          'text-halo-blur': 2,
          'text-halo-width': 2,
          'text-halo-color': '#ffffff'
        }
      });
    }

    if (this.data.position != null) {
      this.name = this.data.position.name;
      this.update(mapContainer, this.data.position.lng, this.data.position.lat, false);

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
        this.update(mapContainer, e.lngLat.lng, e.lngLat.lat, true);
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
      this.update(mapContainer, lngLat.lng, lngLat.lat, true);
    });
  }

  private update(mapContainer: MapboxGl.Map, lng: number, lat: number, searchName: boolean): void {
    this.marker.setLngLat([lng, lat]);
    this.marker.getElement().style.visibility = 'visible';

    if (this.data.radius != null) {
      (mapContainer.getSource(`source_radius`) as GeoJSONSource).setData({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        properties: {}
      });

      mapContainer.setLayoutProperty(`circle_radius`, 'visibility', 'visible');
      mapContainer.setPaintProperty(`circle_radius`, 'circle-radius', {
        stops: [
          [0, 0],
          [20, metersToPixelsAtMaxZoom(this.distanceService.toKm(this.data.radius) * 1000, lat)]
        ],
        base: 2
      });

      mapContainer.setLayoutProperty(`label_radius`, 'visibility', 'visible');
      mapContainer.setPaintProperty(`label_radius`, 'text-translate', {
        stops: [
          [0, [0, 0]],
          [20, [0, metersToPixelsAtMaxZoom(this.distanceService.toKm(this.data.radius) * 1000, lat)]]
        ],
        base: 2
      });
    }

    if (searchName) {
      this.name = null;
      this.placesHttpService
        .reverse({ lat, lng }, true)
        .pipe(
          map((res) => lodash.head(res)?.name),
          catchError(() => of(null))
        )
        .subscribe((next) => {
          this.name = next ?? `${lat},${lng}`;
        });
    }
  }

  doClose(): void {
    this.dialogRef.close();
  }

  doSelect(): void {
    const lngLat = this.marker.getLngLat();
    this.dialogRef.close({
      name: this.name,
      lat: lngLat.lat,
      lng: lngLat.lng
    });
  }
}
