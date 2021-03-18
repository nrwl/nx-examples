import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { defineCustomElements } from '@nx-example/design-system/loader';

defineCustomElements(window);

@NgModule({
  imports: [CommonModule],
})
export class DesignSystemAngularModule {}
