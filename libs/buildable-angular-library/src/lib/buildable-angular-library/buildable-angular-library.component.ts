import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { jsLibrary } from '@nx-example/js-library';

@Component({
  selector: 'nx-example-buildable-angular-library',
  standalone: true,
  providers: [
    {
      provide: 'any',
      useValue: jsLibrary()
    }
  ],
  imports: [CommonModule],
  templateUrl: './buildable-angular-library.component.html',
  styleUrls: ['./buildable-angular-library.component.css'],
})
export class BuildableAngularLibraryComponent {}
