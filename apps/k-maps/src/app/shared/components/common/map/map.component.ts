import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { DEFAULT_MAP_CONFIG, SATELLITE_WITH_ROAD_NAME_STYLE, SATELLITE_WITHOUT_ROAD_NAME_STYLE, WITH_ROAD_NAME_STYLE, WITHOUT_ROAD_NAME_STYLE } from '../helpers/map.helper';
import { DeviceDetectorService } from 'ngx-device-detector';
import * as MapboxGl from 'mapbox-gl';

declare let ResizeSensor;

const LAYERS = [
  'country-label-lg',
  'country-label-sm',
  'country-label-md',
  'state-label-lg',
  'state-label-md',
  'marine-label-lg-pt',
  'marine-label-lg-ln',
  'marine-label-md-pt',
  'marine-label-md-ln',
  'marine-label-sm-pt',
  'marine-label-sm-ln'
];

const MAP_STYLES = [
  {
    useSatellite: false,
    withRoadNames: false,
    multilang: true,
    style: WITHOUT_ROAD_NAME_STYLE
  },
  {
    useSatellite: false,
    withRoadNames: true,
    multilang: true,
    style: WITH_ROAD_NAME_STYLE
  },
  {
    useSatellite: true,
    withRoadNames: false,
    multilang: false,
    style: SATELLITE_WITHOUT_ROAD_NAME_STYLE
  },
  {
    useSatellite: true,
    withRoadNames: true,
    multilang: false,
    style: SATELLITE_WITH_ROAD_NAME_STYLE
  }
];

export interface MapConfig {
  useTwoFingers?: boolean;
  useCTRLZoom?: boolean;
  mapboxOptions?: MapboxGl.MapboxOptions;
  overlay?: boolean;
  overlayHtmlContent?: string;
  withRoadNames?: boolean;
  useSatellite?: boolean;
}

@Component({
  selector: 'mcit-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class McitMapComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('map', { static: true })
  mapElementRef: ElementRef;

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('config')
  mapConfig: MapConfig = {};

  @Output()
  mapLoadEvent = new EventEmitter<mapboxgl.Map>();

  useCTRL = false;
  useTwoFingers = false;
  overlayIsOpen = true;

  supported: boolean = MapboxGl.supported();

  private map: MapboxGl.Map;
  private lastNameLang = '{name_en}';
  private subscriptions: Subscription[] = [];

  private sensor: any;
  private callback: any;

  constructor(private translateService: TranslateService, private deviceDetectorService: DeviceDetectorService) {}

  ngOnInit(): void {
    if (this.supported) {
      try {
        this.mapConfig = Object.assign(
          {},
          {
            useTwoFingers: true,
            useCTRLZoom: true,
            overlay: false,
            overlayHtmlContent: '',
            mapboxOptions: {}
          },
          this.mapConfig
        );

        this.initMap();

        this.subscriptions.push(
          this.translateService.onLangChange.subscribe((next) => {
            if (this.map.loaded()) {
              this.changeLanguage(this.translateService.currentLang);
            }
          })
        );
      } catch (e) {
        this.supported = false;
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.supported) {
      this.map.resize();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((data) => data.unsubscribe());

    if (this.sensor) {
      this.sensor.detach(this.callback);
      this.sensor = null;
    }

    this.map.remove();
  }

  getMap(): any {
    return this.map;
  }

  toggleOverlay() {
    this.overlayIsOpen = !this.overlayIsOpen;
  }

  private initMap(): void {
    const style = MAP_STYLES.find((ms) => ms.useSatellite === this.mapConfig?.useSatellite && ms.withRoadNames === this.mapConfig?.withRoadNames)?.style;

    const c = Object.assign(
      {},
      {
        container: this.mapElementRef.nativeElement,
        style: style ?? DEFAULT_MAP_CONFIG.style,
        center: [DEFAULT_MAP_CONFIG.center.lng, DEFAULT_MAP_CONFIG.center.lat],
        zoom: DEFAULT_MAP_CONFIG.zoom,
        attributionControl: false
      },
      this.mapConfig.mapboxOptions
    );

    this.map = new MapboxGl.Map(c);

    this.callback = () => this.map.resize();

    this.map.on('load', (event) => {
      if (this.mapConfig.useTwoFingers) {
        this.initTwoFingers();
      }
      if (this.mapConfig.useCTRLZoom) {
        this.initCTRLZoom();
      }

      this.changeLanguage(this.translateService.currentLang);

      this.sensor = new ResizeSensor(this.mapElementRef.nativeElement, this.callback);

      this.mapLoadEvent.emit(this.map);
    });
  }

  private initTwoFingers(): void {
    const useTouch = 'ontouchstart' in document.documentElement;
    if (useTouch && !this.deviceDetectorService.isDesktop()) {
      this.map.dragPan.disable();
    }

    const state = {
      panStart: {
        x: 0,
        y: 0
      },
      scale: 1
    };

    let lastTwoFingersTimeout;
    this.map.getContainer().addEventListener(
      'touchstart',
      (event) => {
        if (event.touches.length === 2) {
          this.useTwoFingers = false;
          if (lastTwoFingersTimeout) {
            clearTimeout(lastTwoFingersTimeout);
            lastTwoFingersTimeout = null;
          }

          event.stopImmediatePropagation();
          event.preventDefault();

          let x = 0;
          let y = 0;

          for (let i = 0; i < event.touches.length; i++) {
            const touch = event.touches.item(i);
            x += touch.screenX;
            y += touch.screenY;
          }

          state.panStart.x = x / event.touches.length;
          state.panStart.y = y / event.touches.length;
        } else {
          this.useTwoFingers = true;
          if (lastTwoFingersTimeout) {
            clearTimeout(lastTwoFingersTimeout);
            lastTwoFingersTimeout = null;
          }

          lastTwoFingersTimeout = setTimeout(() => {
            this.useTwoFingers = false;
            lastTwoFingersTimeout = null;
          }, 1000);
        }
      },
      false
    );
    this.map.getContainer().addEventListener(
      'touchmove',
      (event) => {
        if (event.touches.length === 2) {
          const scale = event['scale'] ? event['scale'] : Math.sqrt(Math.pow(event.touches[0].screenX - event.touches[1].screenX, 2) + Math.pow(event.touches[0].screenY - event.touches[1].screenY, 2));

          if (state.scale === scale) {
            event.stopImmediatePropagation();
            event.preventDefault();
          }

          state.scale = scale;

          let x = 0;
          let y = 0;

          for (let i = 0; i < event.touches.length; i++) {
            const touch = event.touches.item(i);
            x += touch.screenX;
            y += touch.screenY;
          }

          const movex = x / event.touches.length - state.panStart.x;
          const movey = y / event.touches.length - state.panStart.y;

          state.panStart.x = x / event.touches.length;
          state.panStart.y = y / event.touches.length;

          this.map.panBy([(movex * 1) / -1, (movey * 1) / -1], {
            animate: false
          });
        }
      },
      false
    );
  }

  private initCTRLZoom(): void {
    let lastCTRLTimeout;

    this.map.on('wheel', (e) => {
      if (!e.originalEvent.ctrlKey) {
        e.preventDefault();

        this.useCTRL = true;

        if (lastCTRLTimeout) {
          clearTimeout(lastCTRLTimeout);
          lastCTRLTimeout = null;
        }

        lastCTRLTimeout = setTimeout(() => {
          this.useCTRL = false;
          lastCTRLTimeout = null;
        }, 1000);
      } else {
        this.useCTRL = false;
        if (lastCTRLTimeout) {
          clearTimeout(lastCTRLTimeout);
          lastCTRLTimeout = null;
        }
      }
    });
  }

  private changeLanguage(lang: string): void {
    const multilang = MAP_STYLES.find((ms) => ms.useSatellite === this.mapConfig?.useSatellite && ms.withRoadNames === this.mapConfig?.withRoadNames)?.multilang;

    if (multilang) {
      const newNameLang = `{name_${lang}}`;

      if (this.lastNameLang === newNameLang) {
        return;
      }

      LAYERS.forEach((layer) => {
        if (layer == null) {
          return;
        }
        const value = this.map.getLayoutProperty(layer, 'text-field');
        if (value == null) {
          return;
        }

        const isString = typeof value === 'string';
        let newValue;
        if (typeof value === 'string') {
          newValue = value.replace(new RegExp(this.lastNameLang, 'g'), newNameLang);
        } else {
          newValue = JSON.parse(JSON.stringify(value).replace(new RegExp(this.lastNameLang, 'g'), newNameLang));
        }

        this.map.setLayoutProperty(layer, 'text-field', newValue);
      });

      this.lastNameLang = newNameLang;
    }
  }
}
