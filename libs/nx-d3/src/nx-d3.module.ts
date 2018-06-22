import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BarComponent } from './bar/bar.component';

@NgModule({
  imports: [CommonModule],
  declarations: [BarComponent],
  exports: [BarComponent]
})
export class NxD3Module {}
