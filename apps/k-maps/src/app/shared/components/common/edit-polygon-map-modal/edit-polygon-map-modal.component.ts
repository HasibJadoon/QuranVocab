import { Component, Inject, OnInit } from '@angular/core';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';
import * as MapboxGl from 'mapbox-gl';
import * as MapboxDraw from '@mapbox/mapbox-gl-draw';
import { FeatureCollection, Polygon } from 'geojson';
import { computeArea } from '../helpers/map.helper';
import { LngLatBounds } from 'mapbox-gl';
import * as lodash from 'lodash';

@Component({
  selector: 'mcit-edit-polygon-map-modal',
  templateUrl: './edit-polygon-map-modal.component.html',
  styleUrls: ['./edit-polygon-map-modal.component.scss']
})
export class McitEditPolygonMapModalComponent implements OnInit {
  currentFeatureCollection: FeatureCollection;
  area: number;

  private center: { lat: number; lng: number };

  constructor(private dialogRef: McitDialogRef<McitEditPolygonMapModalComponent>, @Inject(MCIT_DIALOG_DATA) data: any) {
    this.center = data.center;
    this.currentFeatureCollection =
      data.polygons != null
        ? {
            type: 'FeatureCollection',
            features: data.polygons.map((p) => ({
              type: 'Feature',
              geometry: p
            }))
          }
        : null;
    this.computeArea();
  }

  ngOnInit(): void {}

  doLoadedMap(mapContainer: MapboxGl.Map): void {
    mapContainer.addControl(
      new MapboxGl.NavigationControl({
        showCompass: true,
        visualizePitch: true,
        showZoom: true
      })
    );

    const mapboxDraw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true
      },
      defaultMode: 'draw_polygon'
    });
    mapContainer.addControl(mapboxDraw, 'top-left');

    if (this.currentFeatureCollection != null) {
      mapboxDraw.set(this.currentFeatureCollection);
    }

    const drawEvent = () => {
      this.currentFeatureCollection = mapboxDraw.getAll();

      this.computeArea();
    };

    mapContainer.on('draw.create', drawEvent);
    mapContainer.on('draw.delete', drawEvent);
    mapContainer.on('draw.update', drawEvent);

    if (this.center != null) {
      new MapboxGl.Marker().setLngLat([this.center.lng, this.center.lat]).addTo(mapContainer);
    }

    if (this.currentFeatureCollection?.features?.length > 0) {
      const bounds = lodash
        .flatten(this.currentFeatureCollection.features.filter((f) => f.geometry.type === 'Polygon').map((f) => lodash.flatten((f.geometry as Polygon).coordinates)))
        .reduce((acc, x) => acc.extend([x[0], x[1]]), new LngLatBounds());

      mapContainer.fitBounds(bounds, { maxZoom: 15, padding: 10 });
    } else if (this.center != null) {
      mapContainer.flyTo({
        center: [this.center.lng, this.center.lat],
        zoom: 15
      });
    }
  }

  private computeArea(): void {
    if (this.currentFeatureCollection?.features?.length > 0) {
      this.area = Math.round((this.currentFeatureCollection.features.map((f) => f.geometry).reduce((acc, x) => acc + computeArea(x), 0) / 1000) * 10) / 100;
    } else {
      this.area = null;
    }
  }

  doClose(): void {
    this.dialogRef.close();
  }

  doSelect(): void {
    const polygons = this.currentFeatureCollection.features.filter((f) => f.geometry.type === 'Polygon').map((f) => f.geometry);

    this.dialogRef.close({
      polygons: polygons.length > 0 ? polygons : null
    });
  }
}
