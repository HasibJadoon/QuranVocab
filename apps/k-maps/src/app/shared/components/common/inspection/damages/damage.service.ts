import { Injectable } from '@angular/core';
import { get } from 'lodash';
import { Observable } from 'rxjs';
import { McitDamageExtService } from './damage-ext.service';
import { McitDamageIntService } from './damage-int.service';
import { IVehicleInspectionElement } from '../inspection.model';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';

@TraceErrorClass()
@Injectable()
export class McitDamageService {
  damagePointColor = [255, 193, 7];
  typeRef = {
    INTERNAL: 'INT',
    EXTERNAL: 'EXT'
  };

  constructor(private damageZoneExtService: McitDamageExtService, private damageZoneIntService: McitDamageIntService) {}

  findClosest(x, y, list: Array<IVehicleInspectionElement>) {
    return list.reduce(
      (closest, damage) => {
        const distance = Math.sqrt(Math.pow(x - damage.coordinates.x, 2) + Math.pow(y - damage.coordinates.y, 2));
        return get(closest, 'distance', 1000) < distance ? closest : { ...damage, distance };
      },
      list[0]
        ? {
            ...list[0],
            distance: Math.sqrt(Math.pow(x - list[0].coordinates.x, 2) + Math.pow(y - list[0].coordinates.y, 2))
          }
        : null
    );
  }

  drawOkPoint(ctx, x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2, false);
    ctx.lineWidth = 5;
    ctx.fillStyle = `rgb(0, 128, ${this.damagePointColor[2]})`;
    ctx.fill();
    ctx.font = '12px serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('✓', x, y + 4);
  }

  drawDamagePoint(ctx, x, y, number?) {
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2, false);
    ctx.fillStyle = `rgb(${this.damagePointColor[0]}, ${this.damagePointColor[1]}, ${this.damagePointColor[2]})`;
    ctx.lineWidth = 5;
    ctx.fill();
    if (number) {
      ctx.font = '10px Arial';
      ctx.fillStyle = 'black';
      ctx.textAlign = 'center';
      ctx.fillText(number, x, y + 3);
    }
  }

  caculateInFullScreenProportion(naturalWidth: number, naturalHeight: number) {
    const naturalRatio = naturalWidth / naturalHeight;
    const windowRatio = window.innerWidth / window.innerHeight;
    const margin = 5;
    if (windowRatio > naturalRatio) {
      return {
        get width() {
          return window.innerWidth - margin;
        },
        get height() {
          return this.width / naturalRatio;
        },
        get scale() {
          return this.width / naturalWidth;
        }
      };
    } else {
      return {
        get height() {
          return window.innerWidth - margin;
        },
        get width() {
          return naturalRatio * this.height;
        },
        get scale() {
          return this.height / naturalHeight;
        }
      };
    }
  }

  drawImage(canvasElement, img: HTMLImageElement, defaultScale?: number): Observable<{ width: number; height: number; scale: number }> {
    const ctx = canvasElement.getContext('2d');
    return new Observable((observer) => {
      img.onload = () => {
        const windowProportions = this.caculateInFullScreenProportion(img.naturalWidth, img.naturalHeight);
        let scale = Math.min(windowProportions.scale, 1);
        if (defaultScale) {
          scale = Math.min(scale, defaultScale);
          canvasElement.width = img.naturalWidth * scale;
          canvasElement.height = img.naturalHeight * scale;
        } else {
          canvasElement.width = Math.min(img.naturalWidth, windowProportions.width);
          canvasElement.height = Math.min(img.naturalHeight, windowProportions.height);
        }

        ctx.drawImage(img, 0, 0, canvasElement.width, canvasElement.height);
        observer.next({
          width: canvasElement.width,
          height: canvasElement.height,
          scale
        });
      };
    });
  }

  drawExistingDamages(damageList, ctx, type: string, scale: number): { INT: Set<any>; EXT: Set<any> } {
    const damagedzones = { INT: new Set(), EXT: new Set() };
    damageList.forEach((damage, index) => {
      if (damage.type === type) {
        this.drawDamagePoint(ctx, damage.coordinates.x * scale, damage.coordinates.y * scale, index + 1);
      }
      damagedzones[damage.type].add(damage.zone);
    });
    return damagedzones;
  }

  drawCentersForNonDamaged(ctx, type: string, scale: number, damagedZones: { INT: Set<any>; EXT: Set<any> }) {
    const centers = type === this.typeRef.INTERNAL ? this.damageZoneIntService.getCenters() : this.damageZoneExtService.getCenters();
    Object.keys(centers).forEach((num) => {
      if (!damagedZones[type].has(parseInt(num, 10))) {
        this.drawOkPoint(ctx, centers[num].x * scale, centers[num].y * scale);
      }
    });
  }
}
