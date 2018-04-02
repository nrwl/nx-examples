import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { MatButtonModule, MatCheckboxModule, MatToolbarModule, MatTabsModule } from '@angular/material';

import { HeaderComponent } from './header/header.component';

@NgModule({
  imports: [CommonModule, RouterModule, MatButtonModule, MatCheckboxModule, MatToolbarModule,MatTabsModule, NoopAnimationsModule],
  declarations: [HeaderComponent],
  exports: [HeaderComponent, MatButtonModule, MatCheckboxModule, MatToolbarModule,MatTabsModule, NoopAnimationsModule],
})
export class SharedComponentsModule {}
