import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { BrowserModule } from '@angular/platform-browser';
import { NxModule } from '@nrwl/nx';
import { RouterModule } from '@angular/router';
import { IntroComponent } from './intro/intro.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    NxModule.forRoot(),
    RouterModule.forRoot(
      [
        { path: '', component: IntroComponent },
        { path: 'app1', loadChildren: '@nx-examples/teach/app1#TeachApp1Module' },
        { path: 'app2', loadChildren: '@nx-examples/teach/app2#TeachApp2Module' }
      ],
      { initialNavigation: 'enabled' }
    )
  ],
  declarations: [AppComponent, IntroComponent],
  bootstrap: [AppComponent]
})
export class AppModule {}
