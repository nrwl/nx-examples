import { Action } from '@ngrx/store';

export enum AppActionTypes {
  AppAction = '[App] Action',
  LoadApp = '[App] Load Data',
  AppLoaded = '[App] Data Loaded'
}

export class App implements Action {
  readonly type = AppActionTypes.AppAction;
}
export class LoadApp implements Action {
  readonly type = AppActionTypes.LoadApp;
  constructor(public payload: any) {}
}

export class AppLoaded implements Action {
  readonly type = AppActionTypes.AppLoaded;
  constructor(public payload: any) {}
}

export type AppActions = App | LoadApp | AppLoaded;
