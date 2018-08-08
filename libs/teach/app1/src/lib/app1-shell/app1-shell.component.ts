import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app1-shell',
  template: `
   <mat-toolbar color="primary">
    <span>App1</span>
</mat-toolbar>
<mat-tab-group>
  <mat-tab label="First"> You can have a whole app as app1 library</mat-tab>
  <mat-tab label="Second"> Content 2 </mat-tab>
  <mat-tab label="Third"> Content 3 </mat-tab>
</mat-tab-group>
  `,
  styles: []
})
export class App1ShellComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
