import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { NxModule } from '@nrwl/nx';

import { SharedComponentsModule } from '@nx-examples/shared-components';
import { NxD3Module } from '@nx-examples/nx-d3';
import { D3ExampleComponent } from './d3-example/d3-example.component';

const routes = [
  { path: '', pathMatch: 'full', redirectTo: 'd3' },
  {
    path: 'd3',
    component: D3ExampleComponent
  }
];

@NgModule({
  imports: [BrowserModule, RouterModule.forRoot(routes), NxD3Module, NxModule.forRoot(), SharedComponentsModule],
  declarations: [AppComponent, D3ExampleComponent],
  bootstrap: [AppComponent]
})
export class AppModule {}
