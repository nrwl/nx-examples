import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { NxModule } from '@nrwl/nx';

import { SharedComponentsModule } from '@nx-examples/shared-components';
import { NxD3Module } from '@nx-examples/nx-d3';
import { D3ExampleComponent } from './d3-example/d3-example.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { appReducer, initialState as appInitialState } from './+state/app.reducer';
import { AppEffects } from './+state/app.effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { environment } from '../environments/environment';
import { StoreRouterConnectingModule } from '@ngrx/router-store';
import { storeFreeze } from 'ngrx-store-freeze';

const routes = [
  { path: '', pathMatch: 'full', redirectTo: 'd3' },
  {
    path: 'd3',
    component: D3ExampleComponent
  }
];

@NgModule({
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes),
    NxD3Module,
    NxModule.forRoot(),
    SharedComponentsModule,
    BrowserAnimationsModule,
    StoreModule.forRoot(
  { app: appReducer },
  {
    initialState : { app : appInitialState },
    metaReducers : !environment.production ? [storeFreeze] : []
  }
),
    EffectsModule.forRoot([AppEffects]),
    !environment.production ? StoreDevtoolsModule.instrument() : [],
    StoreRouterConnectingModule
  ],
  declarations: [AppComponent, D3ExampleComponent],
  bootstrap: [AppComponent],
  providers: [AppEffects]
})
export class AppModule {}
