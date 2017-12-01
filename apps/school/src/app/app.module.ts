import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { BrowserModule } from '@angular/platform-browser';
import { NxModule } from '@nrwl/nx';
import { RouterModule } from '@angular/router';
import { SchoolUiModule, schoolUiRoutes } from '@nx-examples/school-ui';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { environment } from '../environments/environment';
import { StoreRouterConnectingModule } from '@ngrx/router-store';
import { appInitialState, appReducer } from '@nx-examples/model';
import { ArModule } from '@nx-examples/ar';

@NgModule({
  imports: [
    BrowserModule,
    NxModule.forRoot(),
    RouterModule.forRoot(
      [{ path: '', children: schoolUiRoutes }, { path: 'slides', loadChildren: '@nx-examples/slides#SlidesModule' }],
      { initialNavigation: 'enabled' }
    ),
    StoreModule.forRoot(appReducer, { initialState: appInitialState }),
    EffectsModule.forRoot([]),
    !environment.production ? StoreDevtoolsModule.instrument() : [],
    StoreRouterConnectingModule,
    SchoolUiModule,
    ArModule
  ],
  declarations: [AppComponent],
  bootstrap: [AppComponent]
})
export class AppModule {}
