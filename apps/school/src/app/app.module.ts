import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { BrowserModule } from '@angular/platform-browser';
import { NxModule } from '@nrwl/nx';
import { RouterModule } from '@angular/router';
import { schoolUiRoutes } from '@nx-examples/school-ui';

@NgModule({
  imports: [
    BrowserModule,
    NxModule.forRoot(),
    RouterModule.forRoot(
      [
        { path: 'school-ui', children: schoolUiRoutes },
        { path: 'slides', loadChildren: '@nx-examples/slides#SlidesModule' }
      ],
      { initialNavigation: 'enabled' }
    )
  ],
  declarations: [AppComponent],
  bootstrap: [AppComponent]
})
export class AppModule {}
