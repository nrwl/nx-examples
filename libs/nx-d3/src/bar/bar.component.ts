import { Component, ElementRef, Input, OnChanges, OnInit, ViewChild } from '@angular/core';

import { max } from 'd3-array';
import { axisBottom, axisLeft } from 'd3-axis';
import { scaleBand, scaleLinear } from 'd3-scale';
import { select } from 'd3-selection';

@Component({
  selector: 'nx-bar',
  templateUrl: './bar.component.html',
  styleUrls: ['./bar.component.scss']
})
export class BarComponent implements OnInit, OnChanges {

  @Input()
  options: any = {
    margin: { top: 20, right: 50, bottom: 30, left: 50 },
    x: scaleBand().padding(0.1),
    y: scaleLinear(),
    xAccessor: (d) => d.id,
    yAccessor: (d) => d.duration,
    size: []
  };
  @Input() data = [];

  @ViewChild('svg') private svgEl: ElementRef;

  svg;
  xAxis;
  yAxis;
  width;
  height;
  private size;

  ngOnChanges(changes) {
    if (changes.data.currentValue !== changes.data.previousValue) {
      if (changes.data.previousValue) {
        this.onResize();
        this.render();
      }
    }
  }

  ngOnInit() {
    this.setUp();
    this.render();
  }

  setUp() {
    this.svg = select(this.svgEl.nativeElement).attr('id', 'chart_svg');

    this.xAxis = this.svg.append('g').attr('class', 'axis axis--x');

    this.yAxis = this.svg
      .append('g')
      .attr('class', 'axis axis--y')
      .attr('transform', `translate(${this.options.margin.left}, 0)`);

    this.onResize();
  }

  onResize(e?) {
    //TODO: Get the parent container size and subtract margins to calculate width/scale. Check for input size
    this.size = [this.el.nativeElement.offsetWidth, this.el.nativeElement.offsetHeight];
    this.width = this.size[0] - (this.options.margin.left + this.options.margin.right);
    this.height = this.width / 3 - (this.options.margin.top + this.options.margin.bottom);
    this.svg
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('transform', 'translate(' + this.options.margin.left + ',' + this.options.margin.top + ')');

    this.options.x.range([this.options.margin.left, this.width - this.options.margin.right]);
    let yRange = this.height - (this.options.margin.top + this.options.margin.bottom);
    this.options.y.range([yRange, 0]);

    this.xAxis.attr('transform', `translate(0, ${this.height - this.options.margin.bottom})`);

  }

  render() {
    //TODO: calculate domain from max(this.data, this.options.yAccessor)
    debugger;
    this.options.y.domain([0, 5565]);
    this.options.x.domain(this.data.map(d => this.options.xAccessor(d)));

    this.xAxis.call(axisBottom(this.options.x));

    //TODO: add tickFormat
    this.yAxis.call(axisLeft(this.options.y).tickFormat(d => d));

    let bars = this.svg.selectAll('rect').data(this.data);

    bars.exit().remove();

    let enter = bars
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('fill', '#6cb8ff')
      .attr('stroke', 'white');

    //TODO: add onmouseover
    bars = enter
      .merge(bars)
      .attr('x', d => this.options.x(this.options.xAccessor(d)))
      .attr('y', d => this.options.y(this.options.yAccessor(d)))
      .attr('width', () => this.options.x.bandwidth())
      .attr('height', d => this.height - this.options.margin.bottom - this.options.y(d.duration))

  }

  constructor(private el: ElementRef) {}

}
