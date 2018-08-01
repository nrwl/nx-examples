import { AppLoaded } from './app.actions';
import { appReducer, initialState } from './app.reducer';

describe('appReducer', () => {
  it('should work', () => {
    const action: AppLoaded = new AppLoaded({});
    const actual = appReducer(initialState, action);
    expect(actual).toEqual({});
  });
});
