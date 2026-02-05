import * as MapboxGl from 'mapbox-gl';
import { bindCallback, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Geometry } from 'geojson';

const EARTH_RADIUS = 6378137; // meters

export const WITH_ROAD_NAME_STYLE = 'mapbox://styles/gabriel-allaigre/ckemkzkj42ego1ankoqy2eis6';
export const WITHOUT_ROAD_NAME_STYLE = 'mapbox://styles/gabriel-allaigre/ckk3qc3234f6s17nlei9xvuvn';

export const SATELLITE_WITH_ROAD_NAME_STYLE = 'mapbox://styles/gabriel-allaigre/ckq0xat0m0acg18pdbddky4ah';
export const SATELLITE_WITHOUT_ROAD_NAME_STYLE = 'mapbox://styles/mapbox/satellite-v9';

export const DEFAULT_MAP_CONFIG = {
  style: WITHOUT_ROAD_NAME_STYLE,
  center: { lat: 48.8568002, lng: 2.3423602 },
  zoom: 4
};

export function computeDistanceBetween(fromLat: number, fromLng: number, toLat: number, toLng: number): number {
  return distanceInMeterBetweenEarthCoordinates(fromLat, fromLng, toLat, toLng);
}

export function computePointAlongAxis(fromLat: number, fromLng: number, toLat: number, toLng: number, distance: number): { lat: number; lng: number } {
  const lineLength = computeDistanceBetween(fromLat, fromLng, toLat, toLng);
  const dLat = (toLat - fromLat) / lineLength;
  const dLng = (toLng - fromLng) / lineLength;

  const lat3 = fromLat + distance * dLat;
  const lng3 = fromLng + distance * dLng;

  return { lat: lat3, lng: lng3 };
}

function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function distanceInMeterBetweenEarthCoordinates(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const c = degreesToRadians(lat1);
  const a = degreesToRadians(lon1);
  const d = degreesToRadians(lat2);
  const b = degreesToRadians(lon2);
  const e = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin((c - d) / 2), 2) + Math.cos(c) * Math.cos(d) * Math.pow(Math.sin((a - b) / 2), 2)));
  return e * EARTH_RADIUS;
}

export function metersToPixelsAtMaxZoom(meters, latitude): number {
  return meters / 0.075 / Math.cos((latitude * Math.PI) / 180);
}

export function loadAndAddImageInMap(mapContainer: MapboxGl.Map, url: string, name: string, options?: any): Observable<void> {
  return bindCallback(mapContainer.loadImage)
    .call(mapContainer, url)
    .pipe(
      map((result) => {
        if (result[0]) {
          throw result[0];
        }
        mapContainer.addImage('custom-marker', result[1], options);
        return void 0;
      })
    );
}

export function computeArea(geometry: Geometry) {
  return calculateArea(geometry);
}

function calculateArea(geom: Geometry): number {
  let total = 0;
  let i;
  switch (geom.type) {
    case 'Polygon':
      return polygonArea(geom.coordinates);
    case 'MultiPolygon':
      for (i = 0; i < geom.coordinates.length; i++) {
        total += polygonArea(geom.coordinates[i]);
      }
      return total;
    case 'Point':
    case 'MultiPoint':
    case 'LineString':
    case 'MultiLineString':
      return 0;
  }
  return 0;
}

function polygonArea(coords: any) {
  let total = 0;
  if (coords && coords.length > 0) {
    total += Math.abs(ringArea(coords[0]));
    for (let i = 1; i < coords.length; i++) {
      total -= Math.abs(ringArea(coords[i]));
    }
  }
  return total;
}

function ringArea(coords: number[][]) {
  let p1;
  let p2;
  let p3;
  let lowerIndex;
  let middleIndex;
  let upperIndex;
  let i;
  let total = 0;
  const coordsLength = coords.length;

  if (coordsLength > 2) {
    for (i = 0; i < coordsLength; i++) {
      if (i === coordsLength - 2) {
        // i = N-2
        lowerIndex = coordsLength - 2;
        middleIndex = coordsLength - 1;
        upperIndex = 0;
      } else if (i === coordsLength - 1) {
        // i = N-1
        lowerIndex = coordsLength - 1;
        middleIndex = 0;
        upperIndex = 1;
      } else {
        // i = 0 to N-3
        lowerIndex = i;
        middleIndex = i + 1;
        upperIndex = i + 2;
      }
      p1 = coords[lowerIndex];
      p2 = coords[middleIndex];
      p3 = coords[upperIndex];
      total += (degreesToRadians(p3[0]) - degreesToRadians(p1[0])) * Math.sin(degreesToRadians(p2[1]));
    }

    total = (total * EARTH_RADIUS * EARTH_RADIUS) / 2;
  }
  return total;
}

export class MapboxGLButtonsControl implements MapboxGl.IControl {
  private container: any;

  constructor(
    private options: {
      className: string;
      title: string;
      onclick: (event: MouseEvent) => void;
    }[]
  ) {}

  onAdd(mapContainer: MapboxGl.Map): HTMLElement {
    this.container = document.createElement('div');
    this.container.className = 'mapboxgl-ctrl-group mapboxgl-ctrl';

    this.options.forEach((option) => {
      const btn = document.createElement('button');
      btn.className = option.className;
      btn.type = 'button';
      btn.title = option.title;
      btn.onclick = option.onclick;

      this.container.appendChild(btn);
    });

    return this.container;
  }

  onRemove(mapContainer: MapboxGl.Map): void {
    this.container.parentNode.removeChild(this.container);
  }
}

export class MapboxGLContainerControl implements MapboxGl.IControl {
  private container: any;

  constructor(private nodes: any[]) {}

  onAdd(mapContainer: MapboxGl.Map): HTMLElement {
    this.container = document.createElement('div');
    this.container.className = 'mapboxgl-ctrl-container mapboxgl-ctrl';

    this.nodes.forEach((node) => this.container.appendChild(node));

    return this.container;
  }

  onRemove(mapContainer: MapboxGl.Map): void {
    this.container.parentNode.removeChild(this.container);
  }
}
