import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { App2ShellComponent } from './app2-shell/app2-shell.component';
@NgModule({
  imports: [CommonModule, RouterModule.forChild([{ path: '', pathMatch: 'full', component: App2ShellComponent }])],
  declarations: [App2ShellComponent],
  exports: [App2ShellComponent],
  entryComponents: [App2ShellComponent]
})
export class TeachApp2Module {}
