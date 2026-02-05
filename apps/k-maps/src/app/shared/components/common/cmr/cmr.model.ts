import { IFullInspection, IVehicleInspectionElement } from '../inspection/inspection.model';
import { IDocumentLink } from '../models/types.model';

export class ICmrRecap {
  cmrDetails?: ICmrDetails;
  client?: ICmrMember;
  sender?: ICmrMember;
  consignee?: ICmrMember;
  real_carrier?: ICmrMember;
  driver?: ICmrDriver;
  vehicleList?: Array<ICmrVehicleForRecap>;
}

export class ICmrByVehicle {
  cmrDetails?: ICmrDetails;
  client?: ICmrMember;
  sender?: ICmrMember;
  consignee?: ICmrMember;
  real_carrier?: ICmrMember;
  driver?: ICmrDriver;
  vehicle?: ICmrVehicleForByVehicle;
}

export class ICmrDetails {
  logo?: string;
  transportType?: string;
  localdate?: string;
  state?: string;
  gefcoRefs?: Array<ICmrGefcoRef>;
  reference?: string;
  tags?: Array<string>;
}

export class ICmrMember {
  // general
  name?: string;
  infos?: ICmrMemberContact;
  // for sender, consignee, carrier
  signature?: string;
  signature_contact?: string;
  observations?: string;
  // for sender, consignee
  contact?: string;
  endDatetime?: string;
  endPosition?: string;
}
export class ICmrMemberContact {
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  placeName?: string;
}

export class ICmrDriver {
  nameList?: Array<string>;
  licensePlateList?: Array<string>;
}

export class ICmrVehicleForRecap {
  maker?: string;
  model?: string;
  color?: string;
  place?: string;
  vin_licence?: string;
  vin?: string;
  license_plate?: string;
  weight?: number;
  insuredValue?: string;
  pickupReserves?: boolean;
  deliveryReserves?: boolean;
  inspection?: IFullInspection;
}
export class ICmrVehicleForByVehicle {
  _id?: string;
  pickupComment?: string;
  deliveryComment?: string;
  pickupPictures?: Array<IDocumentLink>;
  deliveryPictures?: Array<IDocumentLink>;
  inspection?: IFullInspection;
  damages?: ICmrDamages;
  description?: ICmrVehicleForRecap;
}

export class ICmrDamages {
  vehicleData?: ICmrVehicleData;
  pickupDamageList?: Array<IVehicleInspectionElement>;
  deliveryDamageList?: Array<IVehicleInspectionElement>;
}
export class ICmrVehicleData {
  // general
  vehicleId?: string;
  // from rto-manifest
  manifestId?: string;
  // from to-trip
  tripNo?: string;
}

export class ICmrGefcoRef {
  shipNo?: string;
  jfoNo?: string;
}
