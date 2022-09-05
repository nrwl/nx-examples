import { Route, Routes } from 'react-router-dom';
import * as transitiveDependency from '@jridgewell/gen-mapping';
import * as transitiveDependency2 from 'ansi-colors';
import * as peerDependency from 'fuzzy';

import '@nx-example/shared/header';

import { CartCartPage } from '@nx-example/cart/cart-page';

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

// make sure no other linting warnings like "unused variables" are thrown, by pretending to use the imports
export const testfunc = {
  transitiveDependency,
  transitiveDependency2,
  peerDependency,
};
