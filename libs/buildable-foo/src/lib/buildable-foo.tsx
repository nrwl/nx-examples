import React from 'react';
import {BuildableBar} from "@nx-example/buildable-bar";

/* eslint-disable-next-line */
export interface BuildableFooProps {}

export const BuildableFoo = (props: BuildableFooProps) => {
  return (
    <div>
      <h1>Welcome to buildable-foo!</h1>
      <BuildableBar />
    </div>
  );
};

export default BuildableFoo;
