import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { SharedProductStateModule } from '@nx-example/shared/product/state';
import { HomePageComponent } from './home-page/home-page.component';

import { NonProjectComponent } from '../../../../shared/product/components/non-project';
import { ProjectComponent } from '../../../../shared/product/components/project';
// import { ProjectComponent } from '@nx-example/shared/product/component';

@NgModule({
  imports: [
    CommonModule,
    SharedProductStateModule,

    RouterModule.forChild([
      {
        path: '',
        pathMatch: 'full',
        component: HomePageComponent,
      },
    ]),
  ],
  declarations: [HomePageComponent, NonProjectComponent, ProjectComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProductsHomePageModule {}
