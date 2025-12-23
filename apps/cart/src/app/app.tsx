import { Route, Routes } from 'react-router-dom';

import '@nx-example/shared/header';

/**
 * Should throw linting error because lib @nx-example/cart-cart-page only has tags "scope:cart" and "type:feature":
 *
 * A project tagged with "type:app" and "scope:cart" can only depend on libs tagged with "type:no-such-type", "scope:shared", "type:ui"  @nx/enforce-module-boundaries
 */
import { CartCartPage } from '@nx-example/cart-cart-page/src/lib/cart-cart-page/cart-cart-page';

export const App = () => {
  return (
    <>
      <nx-example-header />
      <Routes>
        <Route path="/cart" element={<CartCartPage />} />
      </Routes>
    </>
  );
};

export default App;
