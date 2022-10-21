import { Route, Routes } from 'react-router-dom';

import '@nx-example/shared/header';

import { CartCartPage } from '@nx-example/cart/cart-page';
import { useEffect } from 'react';

export const App = () => {

  if(true) {
		useEffect(() => {
			console.log("test");
		}, []);
	}

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
