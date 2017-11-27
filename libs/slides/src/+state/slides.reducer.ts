import { Slides } from './slides.interfaces';
import { SlidesAction } from './slides.actions';

export function slidesReducer(state: Slides, action: SlidesAction): Slides {
  switch (action.type) {
    case 'DATA_LOADED': {
      return { ...state, ...action.payload };
    }
    default: {
      return state;
    }
  }
}
