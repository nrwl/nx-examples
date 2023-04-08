import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiKitCoreCoreModule as UiKitNoCore } from '@ui-kit/core';

console.log(UiKitNoCore);

@NgModule({
  imports: [CommonModule],
})
export class UiKitCoreCoreModule {}
