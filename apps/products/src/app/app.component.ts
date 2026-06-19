import { ChangeDetectionStrategy, Component } from '@angular/core';

import '@nx-example/shared-header';

@Component({
  selector: 'nx-example-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AppComponent {}
