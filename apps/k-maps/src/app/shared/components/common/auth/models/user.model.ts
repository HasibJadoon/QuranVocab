import { IDocumentLink } from '@lib-shared/common/models/types.model';

export interface User {
  _id: string;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  apps: {
    supervision?: App;
    customer?: App;
    dispatcher?: App;
    driver?: App;
    fvl?: App;
    compound?: App;
    accounting?: App;
  };
  email_verified: string;
  status: string;
}

export interface App {
  name: string;
  roles?: string[];
  third_party?: {
    id: string;
    name: string;
  };
  context?: any | DriverContext;
  valid: boolean;
  language_extension?: string;
}

export interface DriverContext {
  immat: string;
  local?: boolean;
  localTrips?: string[];
  zone: Zone;
  carrier: {
    id: string;
    code: string;
    name: string;
    restrict_driver_app_to_1_rto?: boolean;
  };
  meansType: {
    code: string;
    label: string;
  };
  signature: IDocumentLink;
  discussionId?: string;
}

export interface Zone {
  active: boolean;
  displayName: string;
  location: Location;
  radius: number;
}

export interface Location {
  lat: number;
  lng: number;
}
