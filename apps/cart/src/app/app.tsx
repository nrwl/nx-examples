import React from 'react';
import { Route } from 'react-router-dom';

import { CartCartPage } from '@nx-example/cart/cart-page';

export const App = () => {
  return (
    <>
      <div>Welcome to cart!</div>
      <Route path="/cart" exact component={CartCartPage} />
    </>
  );
};

export default App;
