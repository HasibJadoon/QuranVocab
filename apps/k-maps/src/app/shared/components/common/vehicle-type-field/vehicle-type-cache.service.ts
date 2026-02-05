import { Injectable } from '@angular/core';
import { IVehicleMake, McitVehicleMakesHttpService } from '../services/vehicle-makes-http.service';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { IVehicleModel, McitVehicleModelsHttpService } from '../services/vehicle-models-http.service';
import { map, tap } from 'rxjs/operators';

const FIRST_MAKES = ['PEUGEOT', 'CITROEN', 'DACIA', 'OPEL', 'FORD', 'RENAULT', 'NISSAN', 'BMW', 'FIAT', 'VAUXHALL', 'DS'];

@Injectable({
  providedIn: 'root'
})
export class McitVehicleTypeCacheService {
  private makes: Subject<IVehicleMake[]> = null;
  private models: { [key: string]: Subject<IVehicleModel[]> } = {};

  constructor(private vehicleMakesHttpService: McitVehicleMakesHttpService, private vehicleModelsHttpService: McitVehicleModelsHttpService) {}

  getAllMakes(): Observable<IVehicleMake[]> {
    if (this.makes) {
      return this.makes.asObservable();
    }
    this.makes = new ReplaySubject(1);
    return this.vehicleMakesHttpService.getAll('', {}, 'name', 'code,name').pipe(
      map((res) =>
        FIRST_MAKES.map((c) => res.find((m) => m.code === c))
          .filter((m) => m)
          .concat([null])
          .concat(res)
      ),
      tap((res) => this.makes.next(res))
    );
  }

  getAllModels(maker_id: string): Observable<IVehicleModel[]> {
    if (this.models[maker_id]) {
      return this.models[maker_id].asObservable();
    }
    this.models[maker_id] = new ReplaySubject(1);
    return this.vehicleModelsHttpService.getAll(maker_id, '', {}, 'name', 'code,name,shapes').pipe(tap((res) => this.models[maker_id].next(res)));
  }
}
