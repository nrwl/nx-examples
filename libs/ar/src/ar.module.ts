import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModelLoaderComponent } from './model-loader/model-loader.component';
import { CreateAtCameraComponent } from './create-at-camera/create-at-camera.component';
import { CreateAtSurfaceComponent } from './create-at-surface/create-at-surface.component';
import { ArService } from '@nx-examples/ar/src/ar.service';

@NgModule({
  imports: [CommonModule],
  exports: [ModelLoaderComponent, CreateAtCameraComponent, CreateAtSurfaceComponent],
  declarations: [ModelLoaderComponent, CreateAtCameraComponent, CreateAtSurfaceComponent],
  providers: [ArService]
})
export class ArModule {}
