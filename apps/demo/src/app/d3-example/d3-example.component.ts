import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-d3-example',
  templateUrl: './d3-example.component.html',
  styleUrls: ['./d3-example.component.scss']
})
export class D3ExampleComponent implements OnInit {
  data = [{ id: 1, duration: 2384 }, { id: 2, duration: 5485 }, { id: 3, duration: 2434 }, { id: 4, duration: 5565 }];
  constructor() {}

  ngOnInit() {}
}
