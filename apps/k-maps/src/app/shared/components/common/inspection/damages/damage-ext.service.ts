import { Injectable } from '@angular/core';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';

@TraceErrorClass()
@Injectable()
export class McitDamageExtService {
  private centers = {
    1: { x: 172, y: 87.5 },
    2: { x: 278, y: 266 },
    3: { x: 170, y: 455 },
    4: { x: 62, y: 266 },
    5: { x: 169, y: 280 }
  };

  private rgb = {
    1: [255, 255, 0],
    2: [255, 0, 0],
    3: [128, 0, 128],
    4: [0, 0, 255],
    5: [0, 128, 0]
  };

  getCenters() {
    return this.centers;
  }

  getZoneNumber(x: number, y: number, layerCtx): number {
    const data = layerCtx.getImageData(x, y, 1, 1).data;
    const zone = Object.keys(this.rgb).find((zone2) => this.rgb[zone2][0] === data[0] && this.rgb[zone2][1] === data[1] && this.rgb[zone2][2] === data[2]);
    return parseInt(zone, 10);
  }

  drawShapes(ctx, xoff, yoff, scale) {
    const xPropOf = (number) => (number + xoff) * scale;
    const yPropOf = (number) => (number + yoff) * scale;
    const scaledMoveFn = (x, y) => ctx.moveTo(xPropOf(x), yPropOf(y));
    const scaledBezierFn = (cp1x, cp1y, cp2x, cp2y, x, y) => ctx.bezierCurveTo(xPropOf(cp1x), yPropOf(cp1y), xPropOf(cp2x), yPropOf(cp2y), xPropOf(x), yPropOf(y));
    this.drawZone5(ctx, scaledMoveFn, scaledBezierFn);
    this.drawZone2(ctx, scaledMoveFn, scaledBezierFn);
    this.drawZone4(ctx, scaledMoveFn, scaledBezierFn);
    this.drawZone1(ctx, scaledMoveFn, scaledBezierFn);
    this.drawZone3(ctx, scaledMoveFn, scaledBezierFn);
  }

  private drawZone1(ctx, scaledMoveFn, scaledBezierFn) {
    ctx.beginPath();
    scaledMoveFn(96, 31);
    scaledBezierFn(90, -4, 122, -20, 122, 28);
    scaledBezierFn(122, 29, 220, 33, 219, 25);
    scaledBezierFn(214, -12, 248, -8, 242, 29);
    scaledBezierFn(240, 41, 255, 70, 235, 80);
    scaledBezierFn(234, 65, 243, 150, 239, 167);
    scaledBezierFn(234, 183, 227, 203, 221, 222);
    scaledBezierFn(202, 215, 131, 216, 119, 225);
    scaledBezierFn(109, 200, 104, 181, 100, 169);
    scaledBezierFn(94, 135, 106, 84, 103, 78);
    scaledBezierFn(86, 63, 101, 18, 96, 32);
    ctx.fillStyle = `rgb(${this.rgb['1'][0]}, ${this.rgb['1'][1]}, ${this.rgb['1'][2]}, 255)`;
    ctx.fill();
  }

  private drawZone2(ctx, scaledMoveFn, scaledBezierFn) {
    ctx.beginPath();
    scaledMoveFn(271, 74);
    scaledBezierFn(268, 59, 250, 143, 248, 159);
    scaledBezierFn(246, 174, 227, 210, 223, 224);
    scaledBezierFn(207, 282, 218, 346, 221, 361);
    scaledBezierFn(227, 391, 249, 435, 251, 438);
    scaledBezierFn(256, 445, 300, 450, 311, 439);
    scaledBezierFn(319, 431, 312, 393, 319, 389);
    scaledBezierFn(339, 378, 342, 351, 322, 334);
    scaledBezierFn(317, 329, 314, 168, 321, 164);
    scaledBezierFn(343, 152, 337, 121, 322, 110);
    scaledBezierFn(311, 102, 324, 83, 315, 71);
    scaledBezierFn(312, 67, 283, 62, 271, 71);
    ctx.fillStyle = `rgb(${this.rgb['2'][0]}, ${this.rgb['2'][1]}, ${this.rgb['2'][2]}, 255)`;
    ctx.fill();
  }

  private drawZone3(ctx, scaledMoveFn, scaledBezierFn) {
    ctx.beginPath();
    scaledMoveFn(121, 354);
    scaledBezierFn(106, 354, 183, 362, 219, 355);
    scaledBezierFn(220, 355, 230, 421, 239, 433);
    scaledBezierFn(242, 438, 241, 481, 243, 494);
    scaledBezierFn(250, 530, 218, 545, 220, 497);
    scaledBezierFn(220, 490, 118, 489, 119, 498);
    scaledBezierFn(123, 540, 93, 532, 98, 497);
    scaledBezierFn(99, 488, 96, 441, 103, 431);
    scaledBezierFn(115, 414, 119, 345, 119, 360);
    ctx.fillStyle = `rgb(${this.rgb['3'][0]}, ${this.rgb['3'][1]}, ${this.rgb['3'][2]}, 255)`;
    ctx.fill();
  }

  private drawZone4(ctx, scaledMoveFn, scaledBezierFn) {
    ctx.beginPath();
    scaledMoveFn(73, 82);
    scaledBezierFn(79, 98, 86, 146, 92, 160);
    scaledBezierFn(97, 172, 107, 192, 120, 217);
    scaledBezierFn(127, 230, 125, 344, 121, 358);
    scaledBezierFn(117, 373, 92, 408, 93, 423);
    scaledBezierFn(95, 448, 61, 444, 33, 444);
    scaledBezierFn(18, 444, 28, 393, 22, 389);
    scaledBezierFn(-4, 372, 4, 346, 19, 335);
    scaledBezierFn(24, 331, 22, 171, 15, 164);
    scaledBezierFn(-5, 143, 1, 126, 21, 111);
    scaledBezierFn(26, 108, 14, 75, 28, 70);
    scaledBezierFn(59, 60, 66, 71, 71, 76);
    ctx.fillStyle = `rgb(${this.rgb['4'][0]}, ${this.rgb['4'][1]}, ${this.rgb['4'][2]}, 255)`;
    ctx.fill();
  }

  drawZone5(ctx, scaledMoveFn, scaledBezierFn) {
    ctx.beginPath();
    ctx.moveTo(117, 223);
    ctx.bezierCurveTo(139, 214, 203, 215, 223, 223);
    ctx.bezierCurveTo(215, 241, 218, 329, 219, 354);
    ctx.bezierCurveTo(204, 360, 136, 362, 121, 355);
    ctx.bezierCurveTo(122, 343, 126, 244, 117, 223);
    ctx.fillStyle = `rgb(${this.rgb['5'][0]}, ${this.rgb['5'][1]}, ${this.rgb['5'][2]}, 255)`;
    ctx.fill();
  }
}
