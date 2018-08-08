import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-intro',
  template: `
    <div style="text-align:center">
      <h1>
        Teach Container App Here
      </h1>
      <button>
      <a routerLink="/app1">App 1</a>
      </button>
      <button>
      <a routerLink="/app2">App 2</a>
    </button> 
    </div>
  `,
  styles: []
})
export class IntroComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
