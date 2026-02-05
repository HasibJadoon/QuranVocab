import { AfterViewInit, Component, Inject, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Feature, Point } from 'geojson';
import { compact, first, flatMap, head, isArray, last, uniqBy } from 'lodash';
import * as MapboxGl from 'mapbox-gl';
import { forkJoin, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { McitDateTranslatePipe } from '@lib-shared/common/common/pipes/date-translate.pipe';
import { McitDialogRef } from '@lib-shared/common/dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '@lib-shared/common/dialog/dialog.service';
import { MapboxGLButtonsControl } from '@lib-shared/common/helpers/map.helper';
import { McitMapComponent } from '@lib-shared/common/map/map.component';
import { IMemberRole } from '@lib-shared/common/models/member-role.model';
import { IRoadTransportOrder } from '@lib-shared/common/models/road-transport-order-model';
import { ITrip } from '@lib-shared/common/models/trip.model';
import { ILocalDate } from '@lib-shared/common/models/types.model';
import { IDetailedGeoposition, ITracking } from '@lib-shared/common/models/tracking.model';
import { IRouteResult } from '@lib-shared//common/services/places-http.service';
import { DistanceCalculatorsHttpService } from '../services/distance-calculators-http.service';
import { InitialDistanceCalculator } from '../models/domains/distance-calculator.domain';

enum MapStatus {
  EXE = 'EXE',
  CUR = 'CUR'
}

export enum ObjectType {
  RTO = 'RTO',
  TRIP = 'TRIP'
}

interface IPointInfos {
  memberRole: IMemberRole;
  coords: [number, number];
  pickup?: {
    endRealDate: ILocalDate;
    vehicles: {
      license_plate?: string;
      x_vin?: string;
      vin?: string;
    }[];
  };
  delivery?: {
    endRealDate: ILocalDate;
    vehicles: {
      license_plate?: string;
      x_vin?: string;
      vin?: string;
    }[];
  };
}

interface IMcitMapRouteConfig {
  displayRealRoute?: boolean;
  displayTheoreticRoute?: boolean;
  displayOriginDestinationPoints?: boolean;
  displayLastPosition: boolean;
}

export interface IMcitMapRouteData {
  object: IRoadTransportOrder | ITrip;
  objectType: ObjectType;
  trackings$?: Observable<ITracking[]>;
  config?: IMcitMapRouteConfig;
}

@Component({
  selector: 'mcit-map-route',
  templateUrl: './map-route.component.html',
  styleUrls: ['./map-route.component.scss'],
  providers: [McitDateTranslatePipe]
})
export class McitMapRouteComponent implements OnInit, AfterViewInit {
  COLOR = ['#ffed49', '#2a52f5', '#41bdff', '#ff0000', '#09ff01', '#039300', '#dc9013'];

  legends = [
    {
      class: 'fal fa-horizontal-rule',
      color: this.COLOR[2],
      description: 'LEGEND.THEORETICAL_ROUTE',
      lastGroup: false
    },
    {
      class: 'fas fa-circle',
      color: this.COLOR[0],
      description: 'LEGEND.DELIVERY',
      lastGroup: false
    },
    {
      class: 'fas fa-circle',
      color: this.COLOR[4],
      description: 'LEGEND.PICKUP',
      lastGroup: false
    },
    {
      class: 'fas fa-circle',
      color: this.COLOR[6],
      description: 'LEGEND.PICKUP_DELIVERY',
      lastGroup: false
    },
    {
      class: 'fas fa-running',
      color: this.COLOR[5],
      description: 'LEGEND.DEPART',
      lastGroup: false
    },
    {
      class: 'fas fa-flag-checkered',
      color: this.COLOR[3],
      description: 'LEGEND.ARRIVE',
      lastGroup: false
    },
    {
      class: 'fas fa-map-marker-alt',
      color: this.COLOR[3],
      description: 'LEGEND.LAST_POSITION',
      lastGroup: true
    },
    {
      class: 'fas fa-circle',
      color: this.COLOR[1],
      description: 'LEGEND.REAL_GEOPOSITION',
      lastGroup: false
    },
    {
      class: 'fal fa-horizontal-rule',
      color: this.COLOR[3],
      description: 'LEGEND.LINK_GEOPOSITION',
      lastGroup: false
    }
  ];

  config = {
    displayRealRoute: true,
    displayTheoreticRoute: true,
    displayOriginDestinationPoints: true,
    displayLastPosition: true
  };

  @ViewChild('map', { static: true })
  mapComponent: McitMapComponent;

  @ViewChild('infoMapTemplate')
  infoMapTemplate: TemplateRef<any>;

  @Input()
  typeVehicle = 'truck40t';

  trackings$: Observable<ITracking[]>;
  routes: [IMemberRole, IMemberRole][];
  status: MapStatus;
  lastPosition: IDetailedGeoposition; // Last position step
  stepPointInfos: IPointInfos[];

  constructor(
    private dialogRef: McitDialogRef<McitMapRouteComponent>,
    @Inject(MCIT_DIALOG_DATA) private data: IMcitMapRouteData,
    private distanceCalculatorsHttpService: DistanceCalculatorsHttpService,
    private dateTranslatePipe: McitDateTranslatePipe,
    private translateService: TranslateService
  ) {
    if ((data.object as IRoadTransportOrder).order_no && data.objectType === ObjectType.RTO) {
      this.buildMapInfosFromRto(data.object as IRoadTransportOrder);
    } else if ((data.object as ITrip).trip_no && data.objectType === ObjectType.TRIP) {
      this.buildMapInfosFromTrip(data.object as ITrip);
    } else {
      console.error("This object isn't supported", data.object);
    }

    this.trackings$ = data.trackings$ ?? of([]);
    this.config = {
      ...this.config,
      ...data.config
    };
  }

  ngOnInit(): void {}

  ngAfterViewInit() {
    const listObservable: Observable<any>[] = this.routes.map((oD) => this.distanceCalculatorsHttpService.calculateDistance(oD[0], oD[1], InitialDistanceCalculator.PTV_TRUCK40T, true));
    listObservable.push(this.trackings$);
    forkJoin(listObservable)
      .pipe(tap((obs) => this.initMap(obs)))
      .subscribe();
  }

  private initMap(routes: (IRouteResult | ITracking[])[]): void {
    const mapObj = this.mapComponent.getMap();

    if (mapObj?.loaded()) {
      this.doMapLoaded(routes, mapObj);
    } else {
      mapObj.on('load', () => this.doMapLoaded(routes, mapObj));
    }
  }

  private doMapLoaded(routes: (IRouteResult | ITracking[])[], mapObj: MapboxGl.Map): void {
    const paths: [number, number][][] = routes.filter((route) => !isArray(route)).map((route: IRouteResult) => route.polyline.map((elem) => [elem.x, elem.y]));

    mapObj.addControl(
      new MapboxGl.NavigationControl({
        showCompass: true,
        visualizePitch: true,
        showZoom: true
      })
    );
    mapObj.addControl(
      new MapboxGLButtonsControl([
        {
          className: 'far fa-times fa-lg',
          title: 'close',
          onclick: () => this.doClose()
        }
      ]),
      'top-left'
    );

    if (isArray(last(routes)) && this.config?.displayRealRoute) {
      const trackings = last(routes) as ITracking[];
      const realPath = trackings?.map((elem) => [elem.position.longitude, elem.position.latitude]);
      this.setTracePoint(mapObj, trackings);
      this.setRealLayerRoute(mapObj, realPath);
      mapObj.moveLayer('realRoute', 'trace_point');
    }

    if (this.lastPosition && this.config?.displayLastPosition) {
      new MapboxGl.Marker({
        color: '#ff0000'
      })
        .setLngLat([this.lastPosition.longitude, this.lastPosition.latitude])
        .addTo(mapObj);
    }

    if (this.config?.displayTheoreticRoute) {
      paths.forEach((path, i) => {
        this.setTheoreticRoute(mapObj, path, i);
      });
    }

    // Set Origin/destination
    if (this.config?.displayOriginDestinationPoints) {
      this.setOrigin(mapObj, first(first(paths)));
      this.setDestination(mapObj, last(last(paths)));
    }

    // Set all pickup/delivery
    this.setSteps(mapObj);

    this.installPopupListener(mapObj, paths);

    const bounds = [...flatMap(paths), ...this.stepPointInfos?.map((pointInfos) => pointInfos?.coords)].reduce(function (bound, coord) {
      return bound.extend(coord);
    }, new MapboxGl.LngLatBounds(first(first(paths)), last(last(paths))));

    mapObj.fitBounds(bounds, {
      padding: 50
    });
  }

  private setTheoreticRoute(map: MapboxGl.Map, path: [number, number][], index: number): void {
    const paintRoute = {
      'line-color': this.COLOR[2],
      'line-width': 3
    };

    if (this.status === MapStatus.CUR || this.status === MapStatus.EXE) {
      paintRoute['line-dasharray'] = [5, 2];
    }

    map.addSource('route' + index, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: path
        }
      }
    });

    map.addLayer({
      id: 'route' + index,
      type: 'line',
      source: 'route' + index,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: paintRoute
    });
  }

  private setOrigin(mapObj: MapboxGl.Map, position: [number, number]): void {
    const el = document.createElement('div');
    el.className = 'fas fa-running fa-2x';
    el.style.color = '#039300';

    new MapboxGl.Marker({
      element: el,
      anchor: 'bottom-right'
    })
      .setLngLat(position)
      .addTo(mapObj);
  }

  private setDestination(mapObj: MapboxGl.Map, position: [number, number]): void {
    const el = document.createElement('div');
    el.className = 'fas fa-flag-checkered fa-2x';
    el.style.color = '#ff0000';

    new MapboxGl.Marker({
      element: el,
      anchor: 'bottom-left'
    })
      .setLngLat(position)
      .addTo(mapObj);
  }

  private setTracePoint(mapObj: MapboxGl.Map, trackings: ITracking[]): void {
    mapObj.addSource('trace_point', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    mapObj.addLayer({
      id: 'trace_point',
      type: 'circle',
      source: 'trace_point',
      paint: {
        'circle-color': this.COLOR[1],
        'circle-radius': 3
      }
    });
    const pointFeatures = trackings.map(
      (elem) =>
        ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [elem?.position?.longitude, elem?.position?.latitude]
          },
          properties: {
            color: this.COLOR[1],
            description: this.dateTranslatePipe.transform(elem?.datetime?.utc_date, 'date_time_seconds'),
            pickupIds: 1,
            deliveryIds: 1,
            memberRole: 'toto'
          }
        } as Feature)
    );

    (mapObj.getSource('trace_point') as MapboxGl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: pointFeatures
    });
  }

  private setRealLayerRoute(map: MapboxGl.Map, path: number[][]): void {
    const paintRoute = {
      'line-color': this.COLOR[3],
      'line-width': 2
    };

    map.addSource('realRoute', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: path
        }
      }
    });

    map.addLayer({
      id: 'realRoute',
      type: 'line',
      source: 'realRoute',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: paintRoute
    });
  }

  private setSteps(mapObj: MapboxGl.Map): void {
    ['pickupDelivery', 'pickup', 'delivery'].forEach((step: 'pickupDelivery' | 'pickup' | 'delivery') => {
      mapObj.addSource(step, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      mapObj.addLayer({
        id: step,
        type: 'circle',
        source: step,
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 6,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      (mapObj.getSource(step) as MapboxGl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: this.buildStepPointFeatures(step)
      });
    });
  }

  private setPointDescription(pointInfos: IPointInfos): string {
    const title = pointInfos?.memberRole?.name;
    const desc = compact([pointInfos?.memberRole?.zip, pointInfos?.memberRole?.city, pointInfos?.memberRole?.country?.name]).join(' ');
    return (
      `<div class="font-weight-bold">${title}</div>` +
      `<div>${desc}</div>` +
      this.buildStepDescription(pointInfos?.pickup, 'GROUPAGE_COMPONENT.PANEL.MAP.PICKUP') +
      this.buildStepDescription(pointInfos?.delivery, 'GROUPAGE_COMPONENT.PANEL.MAP.DELIVERY')
    );
  }

  private buildStepDescription(stepPointInfos: IPointInfos['pickup'] | IPointInfos['delivery'], translate: string): string {
    return stepPointInfos
      ? `<hr class="my-1">` +
          `<div class="font-weight-bold">` +
          ` ${this.translateService.instant(translate)} ` +
          `</div>` +
          (stepPointInfos?.endRealDate ? `${this.dateTranslatePipe.transform(stepPointInfos?.endRealDate, 'date')}` : '') +
          `<ul class="mb-0 pl-4">` +
          `${stepPointInfos?.vehicles?.reduce(
            (acc, vehicle) =>
              acc +
              `<li>
          ${head(compact([vehicle?.vin, vehicle.x_vin, vehicle.license_plate]))}
        </li>`,
            ``
          )}` +
          `</ul>`
      : ``;
  }

  private installPopupListener(mapContainer: MapboxGl.Map, realPath: any[]): void {
    const popup = new MapboxGl.Popup({
      closeButton: false,
      closeOnClick: false
    });

    mapContainer.on('mousemove', (event) => {
      const delivery = mapContainer.queryRenderedFeatures(event.point, { layers: ['delivery'] });
      const pickup = mapContainer.queryRenderedFeatures(event.point, { layers: ['pickup'] });
      const pickupDelivery = mapContainer.queryRenderedFeatures(event.point, { layers: ['pickupDelivery'] });
      let traceRoutePoint: MapboxGl.MapboxGeoJSONFeature[];
      if (realPath !== undefined) {
        traceRoutePoint = mapContainer.queryRenderedFeatures(event.point, { layers: ['trace_point'] });
      }

      mapContainer.getCanvas().style.cursor = 'pointer';
      if (delivery.length > 0 || pickup.length > 0 || pickupDelivery.length > 0) {
        const feature = delivery?.[0] ?? pickup?.[0];
        const coordinates = (feature.geometry as Point).coordinates.slice() as [number, number];
        const description = feature.properties.description;

        while (Math.abs(event.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += event.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        popup.setLngLat(coordinates).setHTML(description).addTo(mapContainer);
      } else if (traceRoutePoint !== undefined && traceRoutePoint.length > 0) {
        const feature = traceRoutePoint[0];

        const coordinates = (feature.geometry as Point).coordinates.slice() as [number, number];
        const description = feature.properties.description;

        while (Math.abs(event.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += event.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        popup.setLngLat(coordinates).setHTML(description).addTo(mapContainer);
      } else if (popup.isOpen()) {
        mapContainer.getCanvas().style.cursor = '';
        popup.remove();
      }
    });

    mapContainer.on('mouseout', (_event) => {
      if (popup.isOpen()) {
        mapContainer.getCanvas().style.cursor = '';
        popup.remove();
      }
    });
  }

  private buildMapInfosFromRto(rto: IRoadTransportOrder): void {
    this.lastPosition = rto?.last_position;
    this.status = MapStatus[rto?.status];
    this.routes = rto?.route?.slice(1, -1).map((route) => [route?.start?.member_role, route?.end?.member_role]);

    const memberRolesPickup = uniqBy(
      rto?.manifests.map((man) => man.pickup.member_role),
      (memberRole) => memberRole?.code + memberRole?.name
    );
    this.stepPointInfos = memberRolesPickup?.map((memberRole) => {
      const concatMemberRole = memberRole?.code + memberRole?.name;
      const manifests = rto?.manifests?.filter((veh) => veh.pickup?.member_role?.code + veh?.pickup?.member_role?.name === concatMemberRole);
      const vehicles = flatMap(manifests?.map((man) => man.vehicles));
      return {
        memberRole,
        coords: [memberRole?.geoposition?.longitude, memberRole?.geoposition?.latitude],
        pickup: {
          endRealDate: manifests?.[0]?.pickup.end_real_date,
          vehicles
        }
      };
    });

    const memberRolesDelivery = uniqBy(
      rto?.manifests.map((man) => man?.delivery?.member_role),
      (memberRole) => memberRole?.code + memberRole?.name
    );
    memberRolesDelivery?.forEach((memberRole) => {
      const concatMemberRole = memberRole?.code + memberRole?.name;
      const pointInfos = this.stepPointInfos.find((pInfos) => pInfos?.memberRole?.code + pInfos?.memberRole?.name === concatMemberRole);
      const manifests = rto?.manifests?.filter((veh) => veh?.delivery?.member_role?.code + veh?.delivery?.member_role?.name === concatMemberRole);
      const vehicles = flatMap(manifests?.map((man) => man?.vehicles));
      if (pointInfos) {
        pointInfos.delivery = {
          endRealDate: manifests?.[0]?.delivery?.end_real_date,
          vehicles
        };
      } else {
        this.stepPointInfos.push({
          memberRole,
          coords: [memberRole?.geoposition?.longitude, memberRole?.geoposition?.latitude],
          delivery: {
            endRealDate: manifests?.[0]?.delivery?.end_real_date,
            vehicles
          }
        });
      }
    });
  }

  private buildMapInfosFromTrip(trip: ITrip): void {
    this.lastPosition = trip?.last_position;
    this.status = MapStatus[trip?.status];
    this.routes = [[trip?.origin?.member_role, trip?.destination?.member_role]];

    const memberRolesPickup = uniqBy(
      trip?.vehicles.map((veh) => veh?.pickup?.member_role),
      (memberRole) => memberRole?.code + memberRole?.name
    );
    this.stepPointInfos = memberRolesPickup?.map((memberRole) => {
      const concatMemberRole = memberRole?.code + memberRole?.name;
      const vehicles = trip?.vehicles?.filter((veh) => veh?.pickup?.member_role?.code + veh?.pickup?.member_role?.name === concatMemberRole);
      return {
        memberRole,
        coords: [memberRole?.geoposition?.longitude, memberRole?.geoposition?.latitude],
        pickup: {
          endRealDate: vehicles?.[0]?.pickup?.end_real_date,
          vehicles
        }
      };
    });

    const memberRolesDelivery = uniqBy(
      trip?.vehicles.map((veh) => veh?.delivery?.member_role),
      (memberRole) => memberRole?.code + memberRole?.name
    );
    memberRolesDelivery?.forEach((memberRole) => {
      const concatMemberRole = memberRole?.code + memberRole?.name;
      const pointInfos = this.stepPointInfos.find((pInfos) => pInfos?.memberRole?.code + pInfos?.memberRole?.name === concatMemberRole);
      const vehicles = trip?.vehicles?.filter((veh) => veh?.delivery?.member_role?.code + veh?.delivery?.member_role?.name === concatMemberRole);
      if (pointInfos) {
        pointInfos.delivery = {
          endRealDate: vehicles?.[0]?.delivery?.end_real_date,
          vehicles
        };
      } else {
        this.stepPointInfos.push({
          memberRole,
          coords: [memberRole?.geoposition?.longitude, memberRole?.geoposition?.latitude],
          delivery: {
            endRealDate: vehicles?.[0]?.delivery?.end_real_date,
            vehicles
          }
        });
      }
    });
  }

  private buildStepPointFeatures(pickup: 'pickup' | 'delivery' | 'pickupDelivery'): Feature[] {
    return this.stepPointInfos
      .filter((pointInfo) => {
        if (pickup === 'pickupDelivery') {
          return pointInfo?.pickup && pointInfo?.delivery;
        } else if (pickup === 'pickup') {
          return pointInfo?.pickup;
        } else {
          return pointInfo?.delivery;
        }
      })
      .map((pointInfo) => this.buildPointFeature(pointInfo));
  }

  private buildPointFeature(pointInfos: IPointInfos): Feature {
    const color = pointInfos?.pickup && pointInfos?.delivery ? this.COLOR[6] : pointInfos?.pickup ? this.COLOR[4] : this.COLOR[0];
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: pointInfos?.coords
      },
      properties: {
        color,
        description: this.setPointDescription(pointInfos),
        pickupIds: 1,
        deliveryIds: 1,
        memberRole: JSON.stringify(pointInfos?.memberRole)
      }
    } as Feature;
  }

  doClose(): void {
    this.dialogRef.close(true);
  }
}
