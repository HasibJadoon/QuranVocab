import { ICustomerFile } from '@business-fvl/models/customer-file.model';
import { IWorkOrder, IWorkOrderWork } from '@business-fvl/models/work-order.model';
import { IMeaning, ITracable } from '@lib-shared/common/models/types.model';
import { VehicleLifeStatus } from '@business-fvl/domain/vehicle-life-status.domain';
import { IVehicle } from '@business-fvl/models/vehicle.model';
import { IOperation } from '@business-fvl/models/operation.model';

export type IOWOCustomerFile = Omit<ICustomerFile, 'work_orders'>;

export interface IOnlyWorkOrder extends IWorkOrder, ITracable {
  vehicle_life_id?: string;
  // Numéro interne de la vie véhicule (structure du numéro : "VL"-YYYYMMDD-séquence 8) : ex VL-20191004-00036546
  vehicle_life_no: string;
  // Status vehicule
  vehicle_life_status: VehicleLifeStatus;
  // Vehicule
  vehicle: IVehicle;
  // Dossier client
  customer_file?: IOWOCustomerFile;
  // Operation
  operation?: IOperation;
}

export interface IWorkOrderContractRequest {
  vehicle_life_id?: string;
  customer_file_id?: string;
  operation_id?: string;
  planned_start_date: Date;
  planned_end_date?: Date;
  principal_id: string;
  product_code: string;
  grid_service_contract?: {
    id: string;
    code: string;
    name: string;
  };
  code?: string;
  buyer_id?: string;
  work_order_no?: string;
  work_order_code?: string;
}

export type IWorkOrderFromGrid = Omit<IOnlyWorkOrder, 'works'> & {
  works: Array<
    IWorkOrderWork & {
      // Informations venant de la grille de work orders
      extended_grid_entries?: {
        // Description de prestation venant de la grille
        description?: IMeaning;
        // Nom du service dans référentiel
        ref_name?: IMeaning;
      };
    }
  >;
} & {
  // Informations venant de la grille de work orders
  extended_grid_entries?: {
    recurrency_derogatory_type?: string;

    recurrency_nb_days_weeks_months?: number;

    automatic_creation_nb_days_ignored?: number;

    tarif_exists_on_version_start_date?: boolean;

    starting_rules_list?: string[];

    starting_excluding_rules_list?: string[];

    ending_rules_list?: string[];

    ending_excluding_rules_list?: string[];

    groupable_not_blocking?: boolean;

    shippable_not_blocking?: boolean;

    contractual_delay?: number;
  };
};
