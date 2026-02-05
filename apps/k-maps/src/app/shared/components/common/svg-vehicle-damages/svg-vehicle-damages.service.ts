import { Injectable } from '@angular/core';
import { DataPoint, Point } from '../svg-map/svg-map.component';

// WARNING: This file is also used by Compound team. Please warn them if you change the constants below.
export const EXTERNAL_VEHICLE_DRIVER_CANVAS_WIDTH = 349;
export const EXTERNAL_VEHICLE_DRIVER_CANVAS_HEIGHT = 530;

export const INTERNAL_VEHICLE_DRIVER_CANVAS_WIDTH = 460;
export const INTERNAL_VEHICLE_DRIVER_CANVAS_HEIGHT = 495;

export const EXTERNAL_VEHICLE_SVG_WIDTH = 270;
export const EXTERNAL_VEHICLE_SVG_HEIGHT = 350;

export const INTERNAL_VEHICLE_SVG_WIDTH = 289;
export const INTERNAL_VEHICLE_SVG_HEIGHT = 331;

export const SVG_VEHICLE_MIN_PERCENTAGE_LIMIT = 0;
export const SVG_VEHICLE_MAX_PERCENTAGE_LIMIT = 100;

export const EXTERNAL_VEHICLE_SVG_ZONES = [
  'OTHER',
  'BOOT',
  'WHEEL OSF',
  'WHEEL OSR',
  'WHEEL NSF',
  'WHEEL NSR',
  'REAR LICENSE PLATE',
  'ROOF',
  'FRONT BUMPER',
  'BONNET',
  'WINDSCREEN',
  'REAR BUMPER',
  'LIGHT NSR',
  'WING NSF',
  'LIGHT NSF',
  'DOOR NSF',
  'DOOR NSR',
  'GLASS NSF',
  'GLASS NSR',
  'WING NSR',
  'LIGHT OSR',
  'WING OSF',
  'LIGHT OSF',
  'DOOR OSF',
  'DOOR OSR',
  'GLASS OSF',
  'GLASS OSR',
  'WING OSR'
];

export const EXTERNAL_VEHICLE_COMPOUND_SVG_ZONES = [
  'OTHER',
  'BOOT',
  'WHEEL RIGHT FRONT',
  'WHEEL RIGHT REAR',
  'WHEEL LEFT FRONT',
  'WHEEL LEFT REAR',
  'REAR LICENSE PLATE',
  'ROOF',
  'FRONT BUMPER',
  'BONNET',
  'WINDSCREEN',
  'REAR BUMPER',
  'LIGHT LEFT REAR',
  'WING LEFT FRONT',
  'LIGHT LEFT FRONT',
  'DOOR LEFT FRONT',
  'DOOR LEFT REAR',
  'GLASS LEFT FRONT',
  'GLASS LEFT REAR',
  'WING LEFT REAR',
  'LIGHT RIGHT REAR',
  'WING RIGHT FRONT',
  'LIGHT RIGHT FRONT',
  'DOOR RIGHT FRONT',
  'DOOR RIGHT REAR',
  'GLASS RIGHT FRONT',
  'GLASS RIGHT REAR',
  'WING RIGHT REAR'
];

export const INTERNAL_VEHICLE_COMPOUND_SVG_ZONES = [
  'OTHER',
  'BONNET',
  'FLOOR RIGHT FRONT',
  'FLOOR LEFT FRONT',
  'REAR FLOOR',
  'PARCEL SHELF',
  'BOOT',
  'DOOR LEFT FRONT',
  'DOOR LEFT REAR',
  'DOOR RIGHT FRONT',
  'DOOR RIGHT REAR',
  'SEAT LEFT FRONT',
  'SEAT RIGHT FRONT',
  'SEAT LEFT REAR',
  'CENTER REAR SEAT',
  'SEAT RIGHT REAR',
  'DASHBOARD',
  'RADIO',
  'GEAR LEVEL',
  'STEERING WHEEL'
];

export const INTERNAL_VEHICLE_SVG_ZONES = [
  'OTHER',
  'BONNET',
  'FLOOR OSF',
  'FLOOR NSF',
  'REAR FLOOR',
  'PARCEL SHELF',
  'BOOT',
  'DOOR NSF',
  'DOOR NSR',
  'DOOR OSF',
  'DOOR OSR',
  'SEAT NSF',
  'SEAT OSF',
  'SEAT NSR',
  'CENTER REAR SEAT',
  'SEAT OSR',
  'DASHBOARD',
  'RADIO',
  'GEAR LEVEL',
  'STEERING WHEEL'
];

export enum VehicleElementType {
  INTERNAL = 'INT',
  EXTERNAL = 'EXT'
}

export enum WheelPosition {
  LEFT = 'L',
  RIGHT = 'R'
}

export enum SvgComponentType {
  COMMON = 'COMMON',
  COMPOUND = 'COMPOUND'
}

export interface IAddedOrSelectedPointEmitter {
  point: Point | DataPoint;
  type: VehicleElementType;
  zone: number | string;
}

@Injectable()
export class McitSvgVehicleDamageService {
  static readonly ZONES_MAPPING = {
    EXT: {
      OTHER: -1,

      // Rear
      BOOT: 3,
      'LIGHT NSR': 3,
      'LIGHT OSR': 3,
      'REAR LICENSE PLATE': 3,
      'REAR BUMPER': 3,

      // Top
      ROOF: 5,

      // Front
      BONNET: 1,
      'LIGHT NSF': 1,
      'LIGHT OSF': 1,
      WINDSCREEN: 1,
      'FRONT BUMPER': 1,

      // Left
      'WHEEL NSF': 4,
      'WHEEL NSR': 4,
      'WING NSF': 4,
      'DOOR NSF': 4,
      'DOOR NSR': 4,
      'GLASS NSF': 4,
      'GLASS NSR': 4,
      'WING NSR': 4,

      // Right
      'WHEEL OSF': 2,
      'WHEEL OSR': 2,
      'WING OSF': 2,
      'DOOR OSF': 2,
      'DOOR OSR': 2,
      'GLASS OSF': 2,
      'GLASS OSR': 2,
      'WING OSR': 2
    },
    INT: {
      OTHER: -1,
      // Rear
      'PARCEL SHELF': 3,
      BOOT: 3,

      // Left
      'DOOR NSF': 4,
      'DOOR NSR': 4,

      // Right
      'DOOR OSF': 2,
      'DOOR OSR': 2,

      // Front
      'STEERING WHEEL': 1,
      'SEAT NSF': 1,
      'SEAT OSF': 1,
      'FLOOR OSF': 1,
      'FLOOR NSF': 1,
      DASHBOARD: 1,
      RADIO: 1,
      'GEAR LEVEL': 1,

      // Central
      'REAR FLOOR': 5,
      'SEAT NSR': 5,
      'CENTER REAR SEAT': 5,
      'SEAT OSR': 5
    }
  };

  constructor() {}

  isOldCoordinates(coordinates: { x: number; y: number } | Partial<DataPoint>): boolean {
    coordinates.x = coordinates.x ?? 0;
    coordinates.y = coordinates.y ?? 0;
    return coordinates.x < SVG_VEHICLE_MIN_PERCENTAGE_LIMIT || coordinates.x > SVG_VEHICLE_MAX_PERCENTAGE_LIMIT || coordinates.y < SVG_VEHICLE_MIN_PERCENTAGE_LIMIT || coordinates.y > SVG_VEHICLE_MAX_PERCENTAGE_LIMIT;
  }

  convertOldCoordinatesToActualSvgCoordinates(coordinates: { x: number; y: number } | Partial<DataPoint>, vehicleElementType: VehicleElementType | string): { x: number; y: number } {
    return {
      x: ((coordinates?.x ?? 0) / (vehicleElementType === VehicleElementType.EXTERNAL ? EXTERNAL_VEHICLE_DRIVER_CANVAS_WIDTH : INTERNAL_VEHICLE_DRIVER_CANVAS_WIDTH)) * SVG_VEHICLE_MAX_PERCENTAGE_LIMIT,
      y: ((coordinates?.y ?? 0) / (vehicleElementType === VehicleElementType.EXTERNAL ? EXTERNAL_VEHICLE_DRIVER_CANVAS_HEIGHT : INTERNAL_VEHICLE_DRIVER_CANVAS_HEIGHT)) * SVG_VEHICLE_MAX_PERCENTAGE_LIMIT
    };
  }
}
