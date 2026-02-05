import { VehicleServiceBusiness } from './vehicle-service-business.domain';

export abstract class VehicleServiceCompoundFamily {
  static readonly F41 = 'F41';
  static readonly F42 = 'F42';
  static readonly F43 = 'F43';
  static readonly F44 = 'F44';

  static readonly F20 = 'F20';
  static readonly F21 = 'F21';
  static readonly F22 = 'F22';

  static readonly F10 = 'F10';
  static readonly F11 = 'F11';
  static readonly F12 = 'F12';
  static readonly F13 = 'F13';
  static readonly F14 = 'F14';

  static readonly F31 = 'F31';
  static readonly F32 = 'F32';
}

export abstract class VehicleServiceFamily {
  static readonly F41 = 'F41';
  static readonly F42 = 'F42';
  static readonly F43 = 'F43';
  static readonly F44 = 'F44';

  static readonly F20 = 'F20';
  static readonly F21 = 'F21';
  static readonly F22 = 'F22';

  static readonly F10 = 'F10';
  static readonly F11 = 'F11';
  static readonly F12 = 'F12';
  static readonly F13 = 'F13';
  static readonly F14 = 'F14';

  static readonly F31 = 'F31';
  static readonly F32 = 'F32';

  static readonly '724' = '724';
  static readonly '725' = '725';
  static readonly '722' = '722';
  static readonly '726' = '726';
  static readonly '678' = '678';
  static readonly '723' = '723';
  static readonly '674' = '674';

  static readonly '719' = '719';
  static readonly '716' = '716';
  static readonly '721' = '721';
  static readonly '717' = '717';
  static readonly '718' = '718';
  static readonly '715' = '715';

  static readonly 'VID' = 'VID';
  static readonly 'NOS' = 'NOS';

  static readonly '763' = '763';
  static readonly '714' = '714';
  static readonly '190' = '190';
  static readonly '761' = '761';
  static readonly '713' = '713';
}

export const VEHICLE_SERVICE_FAMILY: Array<string> = Object.keys(VehicleServiceFamily).map((k) => VehicleServiceFamily[k]);

export abstract class VehicleServiceFamilyBusiness {
  static readonly F41 = VehicleServiceBusiness.PV;
  static readonly F42 = VehicleServiceBusiness.PV;
  static readonly F43 = VehicleServiceBusiness.PV;
  static readonly F44 = VehicleServiceBusiness.PV;

  static readonly F20 = VehicleServiceBusiness.MC;
  static readonly F21 = VehicleServiceBusiness.MC;
  static readonly F22 = VehicleServiceBusiness.MC;

  static readonly F10 = VehicleServiceBusiness.PO;
  static readonly F11 = VehicleServiceBusiness.PO;
  static readonly F12 = VehicleServiceBusiness.PO;
  static readonly F13 = VehicleServiceBusiness.PO;
  static readonly F14 = VehicleServiceBusiness.PO;

  static readonly F31 = VehicleServiceBusiness.VN;
  static readonly F32 = VehicleServiceBusiness.VN;

  static readonly '724' = VehicleServiceBusiness.MC;
  static readonly '725' = VehicleServiceBusiness.MC;
  static readonly '722' = VehicleServiceBusiness.MC;
  static readonly '726' = VehicleServiceBusiness.MC;
  static readonly '678' = VehicleServiceBusiness.MC;
  static readonly '723' = VehicleServiceBusiness.MC;
  static readonly '674' = VehicleServiceBusiness.MC;

  static readonly '719' = VehicleServiceBusiness.PO;
  static readonly '716' = VehicleServiceBusiness.PO;
  static readonly '721' = VehicleServiceBusiness.PO;
  static readonly '717' = VehicleServiceBusiness.PO;
  static readonly '718' = VehicleServiceBusiness.PO;
  static readonly '715' = VehicleServiceBusiness.PO;

  static readonly 'VID' = VehicleServiceBusiness.PV;
  static readonly 'NOS' = VehicleServiceBusiness.PV;

  static readonly '763' = VehicleServiceBusiness.VN;
  static readonly '714' = VehicleServiceBusiness.VN;
  static readonly '190' = VehicleServiceBusiness.VN;
  static readonly '761' = VehicleServiceBusiness.VN;
  static readonly '713' = VehicleServiceBusiness.VN;
}

export abstract class FamilyEnumExport {
  static readonly F41 = 'PV-F41-Prestation sur Parc';
  static readonly F42 = 'PV-F42-Douane';
  static readonly F43 = 'PV-F43-Manutention';
  static readonly F44 = 'PV-F44-Stockage';

  static readonly F20 = 'MC-F20-Mécanique';
  static readonly F21 = 'MC-F21-Carrosserie';
  static readonly F22 = 'MC-F22-Rénovation';

  static readonly F10 = 'PO-F10-Personnalisation';
  static readonly F11 = 'PO-F11-Technique';
  static readonly F12 = 'PO-F12-Aménagement';
  static readonly F13 = 'PO-F13-Energie nouvelle';
  static readonly F14 = 'PO-F14-Transformation';

  static readonly F31 = 'VN-F31-Préparation Technique';
  static readonly F32 = 'VN-F32-Préparation Esthétique';

  static readonly '724' = 'DIVERS MC';
  static readonly '725' = 'RENOVATION V.O.';
  static readonly '722' = 'MECANIQUE OLD';
  static readonly '726' = 'LAVAGE PREPARATION V.O.';
  static readonly '678' = 'INTEMPERIE';
  static readonly '723' = 'CARROSSERIE TRADITIONNELLE';
  static readonly '674' = 'PRESTATIONS VO';

  static readonly '719' = '719 GEFCO PERSONNALISATION';
  static readonly '716' = '716 G.P.L. EQUIPEMENT GAZ';
  static readonly '721' = '721 P.P.O. AUTRES';
  static readonly '717' = '717 GEFCO TECHNIQUE';
  static readonly '718' = '718 GEFCO LEATHER';
  static readonly '715' = '715 GESTION WEB';

  static readonly 'VID' = 'VIDE';
  static readonly 'NOS' = 'CENTRES NOSTRA';

  static readonly '763' = '763 P.V.N.';
  static readonly '714' = '714 P V  AUTRE';
  static readonly '190' = '190 P.D.I.';
  static readonly '761' = '761 DEPROTECTION SEULE';
  static readonly '713' = 'PRESTATIONS SUR SITE (713)';
}
