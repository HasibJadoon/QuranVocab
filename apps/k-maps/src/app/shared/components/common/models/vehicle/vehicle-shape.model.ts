import { ITracable } from '../types.model';

export interface IVehicleShape extends ITracable {
  _id: string;
  code: string;
  meaning: string;
}
