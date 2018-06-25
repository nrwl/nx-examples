import { slidesReducer } from './slides.reducer';
import { slidesInitialState } from './slides.init';
import { Slides } from './slides.interfaces';
import { DataLoaded } from './slides.actions';

describe('slidesReducer', () => {
  it('should work', () => {
    const state: Slides = {};
    const action: DataLoaded = { type: 'DATA_LOADED', payload: {} };
    const actual = slidesReducer(state, action);
    expect(actual).toEqual({});
  });
});
