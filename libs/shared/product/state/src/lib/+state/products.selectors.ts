import { ProductsState } from './products.reducer';

export const getProducts = ({ products }: ProductsState) => products;

export const getProduct = ({ products }: ProductsState, productId: string) =>
  products.find((product) => product.id === productId);
