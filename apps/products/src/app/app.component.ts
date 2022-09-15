import { Component } from '@angular/core';
import { v4 } from 'uuid';

import '@nx-example/shared/header';

@Component({
  selector: 'nx-example-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  uuid = v4();
}
