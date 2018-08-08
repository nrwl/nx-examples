import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { App1ShellComponent } from './app1-shell/app1-shell.component';
import { MatTabsModule, MatToolbarModule } from '@angular/material';

@NgModule({
  imports: [
    CommonModule,
    MatTabsModule,
    MatToolbarModule,
    RouterModule.forChild([{ path: '', pathMatch: 'full', component: App1ShellComponent }])
  ],
  declarations: [App1ShellComponent],
  exports: [App1ShellComponent],
  entryComponents: [App1ShellComponent]
})
export class TeachApp1Module {}
