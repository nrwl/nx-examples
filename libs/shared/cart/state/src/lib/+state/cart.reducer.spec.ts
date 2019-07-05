import {
  cartReducer,
  CartState,
  SetQuantity
} from '@nx-example/shared/cart/state';

describe('Cart Reducer', () => {
  let cartState: CartState;
  beforeEach(() => {
    cartState = {
      items: [
        {
          productId: '0',
          quantity: 0
        },
        {
          productId: '1',
          quantity: 1
        }
      ]
    };
  });

  describe('SetQuantity ', () => {
    it('should set the quantity of the cart item', () => {
      const action = new SetQuantity('1', 3);
      const result = cartReducer(cartState, action);

      expect(result.items[1].quantity).toEqual(3);
    });
  });

  describe('unknown action', () => {
    it('should return the initial state', () => {
      const action = {} as any;
      const result = cartReducer(cartState, action);

      expect(result).toBe(cartState);
    });
  });
});
