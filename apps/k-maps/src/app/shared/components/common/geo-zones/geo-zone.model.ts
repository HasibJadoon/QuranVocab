import { IThirdParty } from '../third-party/third-party.model';
import { IMemberRole } from '../models/member-role.model';

export interface GeoZone {
  _id: string;
  code: string;
  name: string;
  platform?: string;
  places?: Array<GeoPlaceReference>;
  third_parties?: Array<IZoneThirdParty>;
  context?: IMemberRole;
  fvl_check?: boolean;
  google_place_ids?: Array<string>;
}

export interface GeoPlaceReference {
  country_code: string;
  zip?: string;
}

export interface GeoZonePlacesUnwind {
  _id: string;
  name: string;
  platform?: string;
  places?: GeoPlaceReference;
}

export interface GeoZoneThirdPartyUnwind {
  _id: string;
  name: string;
  platform?: string;
  third_parties?: IZoneThirdParty;
}

export interface IZoneThirdParty extends IThirdParty {
  gefco_code?: string;
}
