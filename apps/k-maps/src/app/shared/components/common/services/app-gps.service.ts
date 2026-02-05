import { Injectable } from '@angular/core';
import { Device } from '@awesome-cordova-plugins/device/ngx';
import { McitCoreEnv } from '../helpers/provider.helper';

export type McitAppGPSType = 'googlemaps' | 'waze' | 'copilot' | 'applemaps';

const DEFAULT_APP_GPS: McitAppGPSType = 'googlemaps';

@Injectable({
  providedIn: 'root'
})
export class McitAppGPSService {
  private _currentAppGPS: McitAppGPSType = DEFAULT_APP_GPS;

  get defaultAppGPS(): McitAppGPSType {
    return this.env.cordova && this.device.platform === 'iOS' ? 'applemaps' : 'googlemaps';
  }

  get currentAppGPS(): McitAppGPSType {
    return this._currentAppGPS;
  }

  constructor(private device: Device, private env: McitCoreEnv) {}

  useAppGPS(appGPS: McitAppGPSType): void {
    this._currentAppGPS = appGPS;
  }

  getURLNavigation(query: string, lat: number, lng: number): string {
    switch (this._currentAppGPS) {
      case 'googlemaps':
        return `https://www.google.com/maps/dir/?api=1&origin=&destination=${lat},${lng}&travelmode=driving`;
      case 'waze':
        return `https://waze.com/ul?q=${query}&ll=${lat},${lng}&navigate=yes`;
      case 'copilot':
        return `copilot://mydestination?type=LOCATION&action=GOTO&lat=${lat}&long=${lng}`;
      case 'applemaps':
        return `http://maps.apple.com/ul?daddr=${query}&dirflg=d`;
    }
  }
}
