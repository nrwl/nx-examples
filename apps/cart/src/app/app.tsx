import React from 'react';

import { Route } from 'react-router-dom';

export const App = () => {
  return (
    <Route
      path="/cart"
      exact
      render={() => <div>Welcome to cart!</div>}
    />
  );
};

export default App;
