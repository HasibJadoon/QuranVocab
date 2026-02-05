import { Injectable } from '@angular/core';
import { compact, flatten, last } from 'lodash';
import { IDayFleetCosts } from '../../../../../dispatcher/src/app/business/carrier/models/day-fleet-costs.model';
import { ICustomerOrder } from '../../../../../dispatcher/src/app/business/charter/models/customer-order.model';
import { ICustomerFileExtended } from '../../../../../fvl/src/app/business/models/customer-file-extended.model';
import { ICustomerFile, IServiceContract, ITransportContract } from '../../../../../fvl/src/app/business/models/customer-file.model';
import { IVehicleLife } from '../../../../../fvl/src/app/business/models/vehicle-life.model';
import { IWorkOrderContractSearchCriteria } from '../../../../../fvl/src/app/business/models/work-order-contract-pricing.model';
import { IWorkOrder } from '../../../../../fvl/src/app/business/models/work-order.model';
import { RestrictionPurchaseSales } from '../contract/contract.domain';
import { ServiceType } from '../contract/service-type.domain';
import { QuotationMeansRoadTaxedObject } from '../models/domains/quotation-means-road-type.domain';
import { IPricing } from '../models/pricing.model';
import { IQuotationOptions, IQuotationVehicleOptions, PricingFrom } from '../models/quotation-transport-road.model';
import { IMeansRoadContract, IResource } from '../models/resource.model';
import { IRoadTransportOrder } from '../models/road-transport-order-model';
import { IService } from '../models/service.model';
import { ITransportOrder } from '../models/transport-order.model';
import { ITripExtended } from '../models/trip.model';
import { IOperation } from '@business-fvl/models/operation.model';
import { WorkOrderKind } from '../../../../../fvl/src/app/business/domain/work-order-kind.domain';
import { StockType } from '../../../../../fvl/src/app/business/domain/stock-type.domain';

@Injectable({
  providedIn: 'root'
})
export class PricingsHelper {
  constructor() {}

  buildQuotationOptionsFromTransportOrder(to: ITransportOrder): IQuotationOptions {
    let vehicleData: IQuotationVehicleOptions[];
    let noVehicleData: IQuotationVehicleOptions;
    if (!to) {
      return null;
    }
    if (to?.vehicles?.length) {
      const order_date = to?.origin?.real_date?.date ?? to?.origin?.planned_date?.date ?? to?.origin?.desired_date?.date ?? new Date().toDateString();
      vehicleData = compact(
        to?.vehicles
          .filter((v) => !!v)
          .map((vehicle) => ({
            order_date,
            end_date: to?.destination?.real_date?.date ?? to?.destination?.planned_date?.date ?? to?.destination?.desired_date?.date ?? order_date,
            rolling_vehicle: vehicle.moving ?? true,
            pickup: vehicle.pickup?.member_role,
            delivery: vehicle.delivery?.member_role,
            root_pricing: to.sales_pricing,
            maker_code: vehicle.description?.maker?.code,
            model_code: vehicle.description?.model?.code,
            shape_code: vehicle.description?.model?.shape?.code,
            product_code: vehicle.description?.product_id,
            principal_id: to.x_transport_order_no?.startsWith('TP-') && vehicle.customer?.third_party_id ? vehicle.customer?.third_party_id : to.principal?.third_party_id,
            veh_pricing: {
              ...vehicle?.sales_pricing,
              services: vehicle.services
            },
            to_pricing_infos: {
              to_no: vehicle.transport_order?.transport_order_no,
              to_vehs_length: to?.vehicles?.length,
              to_service_type: undefined,
              to_services_price: undefined,
              to_sales_pricing: to?.sales_pricing,
              veh_sales_pricing: to?.vehicles?.find?.((v) => v?._id?.toString() === vehicle?._id)?.tc_pricing
            }
          }))
      );
    } else {
      const order_date = to?.origin?.real_date?.date ?? to?.origin?.planned_date?.date ?? to?.origin?.desired_date?.date ?? new Date().toDateString();
      noVehicleData = {
        order_date,
        end_date: to?.destination?.real_date?.date ?? to?.destination?.planned_date?.date ?? to?.destination?.desired_date?.date ?? order_date,
        rolling_vehicle: true,
        pickup: to?.origin?.member_role,
        delivery: to?.destination?.member_role,
        root_pricing: to?.sales_pricing
      };
    }
    return {
      pricing_from: PricingFrom.TRANSPORT_ORDER,
      vehicle_data: vehicleData,
      no_vehicle_data: noVehicleData,
      path: to.path ? to.path : null
    };
  }

  buildQuotationOptionsFromCustomerOrder(customerOrder: ICustomerOrder): IQuotationOptions {
    let vehicleData: IQuotationVehicleOptions[];
    let noVehicleData: IQuotationVehicleOptions;
    if (!customerOrder) {
      return null;
    }
    if (customerOrder?.vehicles?.length) {
      vehicleData = compact(
        customerOrder?.vehicles
          .filter((v) => !!v)
          .map((vehicle) => ({
            order_date: customerOrder?.origin?.real_date?.date ?? customerOrder?.origin?.planned_date?.date ?? customerOrder?.origin?.desired_date?.date ?? new Date().toDateString(),
            rolling_vehicle: vehicle.moving ?? true,
            pickup: vehicle.pickup?.member_role,
            delivery: vehicle.delivery?.member_role,
            root_pricing: customerOrder.sales_pricing,

            maker_code: vehicle.description?.maker?.code,
            model_code: vehicle.description?.model?.code,
            shape_code: vehicle.description?.model?.shape?.code,
            veh_pricing: {
              ...vehicle?.sales_pricing,
              services: vehicle.services
            }
          }))
      );
    } else {
      noVehicleData = {
        order_date: customerOrder?.origin?.real_date?.date ?? customerOrder?.origin?.planned_date?.date ?? customerOrder?.origin?.desired_date?.date ?? new Date().toDateString(),
        rolling_vehicle: true,
        pickup: customerOrder?.origin?.member_role,
        delivery: customerOrder?.destination?.member_role,
        root_pricing: customerOrder?.sales_pricing
      };
    }
    return {
      pricing_from: PricingFrom.TRANSPORT_ORDER,
      vehicle_data: vehicleData,
      no_vehicle_data: noVehicleData,
      path: customerOrder.path ? customerOrder.path : null
    };
  }

  buildQuotationOptionsFromTrip(trip: ITripExtended): IQuotationOptions {
    let vehicleData: IQuotationVehicleOptions[];
    let noVehicleData: IQuotationVehicleOptions;
    if (!trip) {
      return null;
    }
    const orderDate = trip?.origin?.real_date?.date ?? trip?.origin?.planned_date?.date ?? trip?.origin?.desired_date?.date ?? new Date().toDateString();
    const orderEndDate = trip?.destination?.real_date?.date ?? trip?.destination?.planned_date?.date ?? trip?.destination?.desired_date?.date ?? orderDate;
    if (trip?.vehicles?.length) {
      vehicleData = compact(
        trip?.vehicles
          .filter((v) => !!v)
          .map((vehicle) => ({
            order_date: orderDate,
            end_date: orderEndDate,
            rolling_vehicle: vehicle.moving ?? true,
            pickup: vehicle.pickup?.member_role,
            delivery: vehicle.delivery?.member_role,
            root_pricing: { ...trip.purchase_pricing, total_price: null },
            principal_id: vehicle.customer?.third_party_id,
            product_code: vehicle.description?.product_id,
            maker_code: vehicle.description?.maker?.code,
            model_code: vehicle.description?.model?.code,
            shape_code: vehicle.description?.model?.shape?.code,
            veh_pricing: {
              ...vehicle?.purchase_pricing,
              delta_price: null,
              total_price: null,
              services: vehicle.purchase_services.map((s) => ({
                ...s,
                type: s.type ?? trip.contract_trsp?.service_type ?? ServiceType.VIN
              })) as IService[]
            },

            to_pricing_infos: {
              to_no: vehicle.transport_order?.transport_order_no,
              to_vehs_length: (vehicle?.transport_order?.transport_order_id as ITransportOrder)?.vehicles?.length,
              to_service_type: (vehicle?.transport_order?.transport_order_id as ITransportOrder)?.contract_trsp?.service_type,
              to_services_price: compact(flatten((vehicle?.transport_order?.transport_order_id as ITransportOrder)?.vehicles?.map((v) => v?.services?.map((s) => s?.price)))).reduce((acc, cur) => (acc ?? 0) + (cur ?? 0), 0),
              to_sales_pricing: (vehicle?.transport_order?.transport_order_id as ITransportOrder)?.sales_pricing,
              veh_sales_pricing: (vehicle?.transport_order?.transport_order_id as ITransportOrder)?.vehicles?.filter?.((v) => v?._id?.toString() === vehicle?._id)?.[0]?.sales_pricing
            }
          }))
      );
    } else {
      noVehicleData = {
        order_date: orderDate,
        end_date: orderEndDate,
        rolling_vehicle: true,
        pickup: trip?.origin?.member_role,
        delivery: trip?.destination?.member_role,
        root_pricing: { ...trip.purchase_pricing, total_price: null },

        to_pricing_infos: {
          to_no: trip.transport_order?.transport_order_no,
          to_vehs_length: 0,
          to_service_type: (trip.transport_order?.transport_order_id as ITransportOrder)?.contract_trsp?.service_type,
          to_services_price: (trip.transport_order?.transport_order_id as ITransportOrder)?.sales_pricing?.services_price,
          to_sales_pricing: (trip.transport_order?.transport_order_id as ITransportOrder)?.sales_pricing
        }
      };
    }
    return {
      pricing_from: PricingFrom.TRIP,
      path: trip.path ? trip.path : null,
      vehicle_data: vehicleData,
      no_vehicle_data: noVehicleData
    };
  }

  buildQuotationOptionsFromCustomerFile(customerFile: ICustomerFileExtended, contract: ITransportContract | IServiceContract, orderStartDate: string, orderEndDate: string): IQuotationOptions {
    const vehicleData: any[] = [
      {
        order_date: orderStartDate,
        end_date: orderEndDate,
        rolling_vehicle: customerFile.vehicle?.moving ?? true,
        maker_code: customerFile.vehicle?.veh_attributes?.model?.moveecar_vehicle?.make?.code,
        model_code: customerFile.vehicle?.veh_attributes?.model?.moveecar_vehicle?.model?.code,
        shape_code: customerFile.vehicle?.veh_attributes?.model?.moveecar_vehicle?.model?.shape?.code,
        model_x_code: customerFile.vehicle?.veh_attributes?.model?.x_code,
        product_code: customerFile.product?.code,
        principal_id: customerFile.principal.third_party_id,
        supplier_id: contract.supplier?.third_party_id,
        owner_id: contract.owner?.third_party_id,
        root_pricing: contract.pricing
      }
    ];
    if ((<ITransportContract>contract).transport_work) {
      vehicleData[0].pickup = (<ITransportContract>contract).transport_work.origin;
      vehicleData[0].delivery = (<ITransportContract>contract).transport_work.destination;
    } else if ((<IServiceContract>contract).service_work) {
      vehicleData[0].pickup = (<IServiceContract>contract).service_work?.site;
    }

    return {
      pricing_from: PricingFrom.UNCREATED_VEHICLES,
      vehicle_data: vehicleData
    };
  }

  buildWorkOrderContractFromCustomerFile(
    vehicleLife: IVehicleLife,
    workOrder: IWorkOrder,
    customerFile: ICustomerFile,
    restrictionPurchaseSales: RestrictionPurchaseSales,
    serviceContract?: IServiceContract,
    operation?: IOperation
  ): IWorkOrderContractSearchCriteria {
    const operationFromVL = vehicleLife.operations.find((ope) => ope._id === serviceContract?.service_work?.operation?._id);
    const startDate = workOrder.derogatory_real_start_date?.date ?? workOrder.real_start_date?.date ?? workOrder.planned_start_date?.date ?? new Date().toISOString();
    const associatedStkcWorkOrder = customerFile.work_orders.find(
      (wo) =>
        wo.works.find((work) => work.vehicle_service?.code === StockType.STKC) && wo.exploit_center?.third_party_id === workOrder.exploit_center.third_party_id && wo.work_order_kind === WorkOrderKind.STOCKAGE && wo._id !== workOrder._id
    );
    return {
      validity_date: startDate,
      principal: customerFile?.principal,
      location_id: operation?.exploit_center?.third_party_id ?? operationFromVL?.exploit_center?.third_party_id,
      billed_id: restrictionPurchaseSales === RestrictionPurchaseSales.PURCHASE ? serviceContract?.supplier?.third_party_id : undefined,
      buyer_id: workOrder.buyer?.third_party_id,
      offers_product_codes: customerFile?.product?.code ? [customerFile.product.code] : [],
      center: operation?.center?.member_role ?? operationFromVL?.center?.member_role,
      exploit_system: operation?.exploit_ext_system ?? operationFromVL?.exploit_ext_system,
      work_order_kind: workOrder.work_order_kind,
      work_order_code: workOrder.work_order_code,
      vehicle: {
        veh_condition: vehicleLife.vehicle.veh_condition,
        veh_attributes: {
          maker: {
            code: vehicleLife.vehicle.veh_attributes.model?.moveecar_vehicle?.make?.code,
            name: vehicleLife.vehicle.veh_attributes.model?.moveecar_vehicle?.make?.name
          },
          model: {
            code: vehicleLife.vehicle.veh_attributes.model?.moveecar_vehicle?.model?.code,
            name: vehicleLife.vehicle.veh_attributes.model?.moveecar_vehicle?.model?.name,
            shape: vehicleLife.vehicle.veh_attributes.model?.moveecar_vehicle?.model?.shape?.code
              ? {
                  code: vehicleLife.vehicle.veh_attributes.model.moveecar_vehicle.model.shape.code,
                  name: vehicleLife.vehicle.veh_attributes.model.moveecar_vehicle.model.shape.name
                }
              : undefined
          }
        },
        moving: vehicleLife.vehicle.moving
      },
      status: workOrder.status,
      customer_work_order_group: workOrder.customer_work_order_group,
      works: workOrder.works?.map((item) => ({
        vehicle_service: {
          ...item.vehicle_service,
          name: item.vehicle_service?.name.fr
        },
        status: item.status,
        type_x_code: item.type_x_code,
        start_date: item.real_start_date?.date,
        end_date: item.real_end_date?.date,
        quantity: item.quantity
      })),
      start_date: startDate,
      end_date:
        workOrder.derogatory_real_end_date?.date ?? workOrder.next_storage_real_start_date?.date ?? workOrder.center_exit_real_date?.date ?? workOrder.real_end_date?.date ?? workOrder.planned_end_date?.date ?? new Date().toISOString(),
      next_storage_real_start_date: workOrder.next_storage_real_start_date?.date,
      center_exit_real_date: workOrder.center_exit_real_date?.date,
      call_off_date: workOrder.center_exit_real_date?.date,
      restriction_purchase_sales: restrictionPurchaseSales,
      root_pricing: serviceContract?.pricing,
      associated_stkc_work_order: associatedStkcWorkOrder && {
        work_order_kind: associatedStkcWorkOrder.work_order_kind,
        work_order_code: associatedStkcWorkOrder.work_order_code,
        real_start_date: associatedStkcWorkOrder.real_start_date?.date
      },
      list_pos_mvt: vehicleLife.operations
        ?.flatMap((vlOperation) => {
          return vlOperation.covered_location_movements?.map((movement) => {
            return {
              position: movement.position,
              check_covered: movement.position_check_covered,
              real_date: movement.real_date?.date?.toString()
            };
          });
        })
        .filter(Boolean),
      model_x_code: vehicleLife.vehicle.veh_attributes?.model?.x_code,
      veh_type: vehicleLife.vehicle.veh_attributes?.model?.type?.code,
      delivery_third_party_code: vehicleLife.delivery?.member_role?.code,
      delivery_third_party_gefco_code: vehicleLife.delivery?.member_role?.gefco_code,
      delivery_third_party_id: vehicleLife.delivery?.member_role?.third_party_id,
      delivery_third_party_country_code: vehicleLife.delivery?.member_role?.country?.code,
      delivery_third_party_zip: vehicleLife.delivery?.member_role?.zip,
      final_dest_third_party_code: vehicleLife.consignee?.code,
      final_dest_third_party_gefco_code: vehicleLife.consignee?.gefco_code,
      final_dest_third_party_id: vehicleLife.consignee?.third_party_id,
      final_dest_third_party_country_code: vehicleLife.consignee?.country?.code,
      final_dest_third_party_zip: vehicleLife.consignee?.zip,
      customer_references: vehicleLife?.customer_reference?.length
        ? vehicleLife?.customer_reference?.reduce((acc: Record<string, string[]>, current) => {
            const { x_reference_kind, reference } = current;
            if (x_reference_kind && reference) {
              acc[x_reference_kind] = acc[x_reference_kind] || [];
              acc[x_reference_kind].push(reference);
            }
            return acc;
          }, {})
        : undefined
    } as IWorkOrderContractSearchCriteria;
  }

  buildQuotationOptionsFromRto(rto: IRoadTransportOrder, mreContract: IMeansRoadContract, rootPricing?: IPricing): IQuotationOptions {
    const orderDate = rto.start?.real_date?.date || rto.start?.planned_date;
    const vehicleData = rto.manifests?.reduce((acc: IQuotationVehicleOptions[], manifest) => {
      if (manifest?.vehicles?.length > 0) {
        acc.push(
          ...manifest.vehicles.map(
            (vehicle) =>
              ({
                order_date: orderDate,
                rolling_vehicle: vehicle.moving ?? true,
                pickup: manifest.pickup?.member_role,
                delivery: manifest.delivery?.member_role,
                maker_code: vehicle.maker?.code,
                model_code: vehicle.model?.code,
                shape_code: vehicle.model?.shape?.code
              } as IQuotationVehicleOptions)
          )
        );
      }
      return acc;
    }, []);
    const noVehicleData = !vehicleData?.length
      ? {
          order_date: orderDate,
          rolling_vehicle: true,
          pickup: rto.manifests?.[0]?.pickup?.member_role,
          delivery: rto.manifests?.[0]?.delivery?.member_role
        }
      : undefined;
    return {
      pricing_from: PricingFrom.RTO,
      mre_data: {
        order_date: orderDate,
        root_pricing: rootPricing,
        type: QuotationMeansRoadTaxedObject.RTO,
        tarif_code: mreContract?.pricing_code,
        rto: {
          loaded_distance: (rto.costs.distances.distance_loaded ?? 0) + (rto.costs.distances.distance_loaded_delta ?? 0),
          empty_distance_before: (rto.costs.distances.distance_empty_before ?? 0) + (rto.costs.distances.distance_empty_delta ?? 0),
          empty_distance_after: (rto.costs.distances.distance_empty_after ?? 0) + (rto.costs.distances.distance_empty_delta ?? 0),
          total_rtos_distance: rto.costs.distances.total_grouped_rtos_distance || undefined,
          vehicle_data: vehicleData?.length > 0 ? vehicleData : undefined,
          no_vehicle_data: noVehicleData,
          starting_place: rto.costs.starting_place,
          ending_place: rto.costs.ending_place,
          stop_count: rto.stop_count,
          country_crossed: rto.mre_data?.rto?.country_crossed
        }
      },
      path: rto.manifests?.[0]?.path ? rto.manifests?.[0]?.path : null
    };
  }

  buildQuotationOptionsFromDfc(dfc: IDayFleetCosts, mreContract: IMeansRoadContract): IQuotationOptions {
    return {
      pricing_from: PricingFrom.DFC,
      mre_data: {
        type: QuotationMeansRoadTaxedObject.DFC,
        order_date: dfc.date,
        root_pricing: dfc.pricings?.root,
        tarif_code: mreContract?.pricing_code,
        dfc: {
          days: (dfc.total_day ?? 0) + (dfc.delta_day ?? 0),
          stop_count: dfc.stop_count
        }
      }
    };
  }

  findRightMreContract(resource: IResource, applicationDate: Date): IMeansRoadContract {
    const rightContracts = resource?.mre_contracts?.filter(
      (c: IMeansRoadContract) => this.validateContractApplicationDate(c.application_start_date, applicationDate, true) && this.validateContractApplicationDate(c.application_end_date, applicationDate, false)
    );
    return last(rightContracts ?? []);
  }

  private validateContractApplicationDate(date: string, applicationDate: Date, isBefore: boolean): boolean {
    if (!date) {
      return true;
    }
    const jsDate = new Date(date);
    if (!isBefore) {
      jsDate.setHours(23, 59, 59, 999);
    }
    return isBefore ? jsDate <= applicationDate : jsDate >= applicationDate;
  }
}
