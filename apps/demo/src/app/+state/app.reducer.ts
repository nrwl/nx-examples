import { Action } from '@ngrx/store';
import { AppActions, AppActionTypes } from './app.actions';

/**
 * Interface for the 'App' data used in
 *  - AppState, and
 *  - appReducer
 */
export interface AppData {}

/**
 * Interface to the part of the Store containing AppState
 * and other information related to AppData.
 */
export interface AppState {
  readonly app: AppData;
}

export const initialState: AppData = {};

export function appReducer(state = initialState, action: AppActions): AppData {
  switch (action.type) {
    case AppActionTypes.AppAction:
      return state;

    case AppActionTypes.AppLoaded: {
      return { ...state, ...action.payload };
    }

    default:
      return state;
  }
}
