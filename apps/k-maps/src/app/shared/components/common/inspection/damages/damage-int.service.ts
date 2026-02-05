import { Injectable } from '@angular/core';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';

@TraceErrorClass()
@Injectable()
export class McitDamageIntService {
  private zones = {
    1: [129, 0, 330, 175],
    2: [331, 100, 458, 366],
    3: [132, 292, 321, 455],
    4: [0, 100, 124, 366],
    5: [129, 176, 330, 291]
  };

  getCenters() {
    const centers = {};
    Object.keys(this.zones).map((num) => {
      const z = this.zones[num];
      centers[num] = { x: (z[2] + z[0]) / 2, y: (z[3] + z[1]) / 2 };
    });
    return centers;
  }

  getZoneNumber(x: number, y: number): number {
    const zone = Object.keys(this.zones).find((num) => {
      const z = this.zones[num];
      return x >= z[0] && x <= z[2] && y >= z[1] && y <= z[3];
    });
    return parseInt(zone, 10);
  }
}
