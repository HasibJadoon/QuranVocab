export interface ILightThirdParty {
  charter?: {
    driver_barcode_pickup_points?: string[];
    show_trip_and_truck_plate_barcodes?: boolean;
  };
  carrier?: {
    restrict_driver_app_to_1_rto: boolean;
  };
}
