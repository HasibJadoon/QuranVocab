import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { D3, NgxD3Service } from '@katze/ngx-d3';

export class Point {
  x: number;
  y: number;

  constructor(point: Partial<Point> | any) {
    point = point || {};
    this.x = typeof point.x === 'string' ? parseFloat(point.x) : point.x;
    this.y = typeof point.y === 'string' ? parseFloat(point.y) : point.y;
  }
}

export class DataPoint extends Point {
  data: any;

  constructor(dataPoint: Partial<DataPoint> | any) {
    dataPoint = dataPoint || {};
    super(dataPoint);
    this.data = dataPoint.data;
  }
}

@Component({
  selector: 'mcit-svg-map',
  templateUrl: './svg-map.component.html',
  styleUrls: ['./svg-map.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class McitSvgMapComponent implements OnInit, OnDestroy {
  @Input() viewportWidth: number;
  @Input() viewportHeight: number;
  @Input() svgSource: string;
  @Input() zones: string[];
  @Input() backgrounds: string[];

  @Input() points: (Point | DataPoint)[];
  @Input() selectedPoint: Point;

  @Output() pointAdded: EventEmitter<Point>;
  @Output() pointSelected: EventEmitter<Point>;

  private _pointRadius;
  private readonly parentNativeElement: any;
  private d3Svg: d3.Selection<SVGSVGElement, Point, HTMLElement, any>;
  selectedZone: string;
  private readonly d3: D3;

  constructor(element: ElementRef, d3Service: NgxD3Service, private ngZone: NgZone, private changeDetectorRef: ChangeDetectorRef) {
    this.d3 = d3Service.getD3();
    this.parentNativeElement = element.nativeElement;
    this.points = [];
    this.pointAdded = new EventEmitter<Point>();
    this.pointSelected = new EventEmitter<Point>();
  }

  ngOnDestroy(): void {
    if (this.d3Svg.empty && !this.d3Svg.empty()) {
      this.d3Svg.selectAll('*').remove();
    }
  }

  ngOnInit(): void {
    this._pointRadius = (8 * this.viewportWidth) / 200;
    this.d3Svg = this.d3.select<HTMLElement, Point>(this.parentNativeElement).select<SVGSVGElement>('.svg-map').attr('viewBox', `0 0 ${this.viewportWidth} ${this.viewportHeight}`);
    this.refresh();
  }

  refresh(): void {
    const pointsSelection = this.d3Svg.selectAll<SVGSVGElement, Point>('.point').data(this.points, (point) => point.x + '|' + point.y);
    pointsSelection
      .classed('selected', (point) => point === this.selectedPoint)
      .select('text')
      .text((point) => (point instanceof DataPoint ? point.data?.toString() : ''));

    const newPointsSelection = pointsSelection
      .enter()
      .append('svg')
      .classed('point', true)
      .classed('selected', (point) => point === this.selectedPoint)
      .attr('x', (point) => (point.x * this.viewportWidth) / 100 - this._pointRadius)
      .attr('y', (point) => (point.y * this.viewportHeight) / 100 - this._pointRadius)
      .on('click', (point) => {
        this.pointSelected.emit(point);
      })
      .on('mouseenter', (point: Point) => {
        this.d3.select(this.d3.event.target).classed('hovered', this.selectedPoint !== point);
      })
      .on('mouseleave', (point: Point) => {
        this.d3.select(this.d3.event.target).classed('hovered', false);
      });

    newPointsSelection
      .append('circle')
      .attr('cx', this._pointRadius)
      .attr('cy', this._pointRadius)
      .attr('r', 0)
      .classed('selected', (point) => point === this.selectedPoint)
      .transition()
      .duration(400)
      .attr('r', this._pointRadius);

    newPointsSelection
      .append('text')
      .style('font-size', (8 * this.viewportWidth) / 200)
      .attr('x', this._pointRadius)
      .attr('y', this._pointRadius)
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'central')
      .classed('label', true)
      .text((point) => (point instanceof DataPoint ? point.data?.toString() : ''));

    pointsSelection.exit().remove().select('circle').transition().duration(400).style('opacity', 0).attr('r', 0);

    this.changeDetectorRef.detectChanges();
  }

  private addPoint(event: MouseEvent): void {
    let pointX = event.clientX;
    let pointY = event.clientY;
    const svgRect = this.d3Svg.node().getBoundingClientRect();
    pointX -= svgRect.left;
    pointY -= svgRect.top;
    pointX = (pointX * this.viewportWidth) / svgRect.width;
    pointY = (pointY * this.viewportHeight) / svgRect.height;
    const point = new Point({ x: (pointX / this.viewportWidth) * 100, y: (pointY / this.viewportHeight) * 100 });
    this.pointAdded.emit(point);
  }
}
