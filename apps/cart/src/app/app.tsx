import { Route, Routes } from 'react-router-dom';

import '@nx-example/shared/header';

import { CartCartPage } from '@nx-example/cart/cart-page';
import { environment } from '../environments/environment';

export const App = () => {
  return (
    <>
      <nx-example-header />
      <Routes>
        <Route
          path="/cart"
          element={<CartCartPage baseUrl={environment.baseApiPath} />}
        />
      </Routes>
    </>
  );
};

export default App;
