import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModelLoaderComponent } from './model-loader/model-loader.component';
import { CreateAtCameraComponent } from './create-at-camera/create-at-camera.component';
import { CreateAtSurfaceComponent } from './create-at-surface/create-at-surface.component';

@NgModule({
  imports: [CommonModule],
  exports: [ModelLoaderComponent, CreateAtCameraComponent, CreateAtSurfaceComponent],
  declarations: [ModelLoaderComponent, CreateAtCameraComponent, CreateAtSurfaceComponent]
})
export class ArModule {}
