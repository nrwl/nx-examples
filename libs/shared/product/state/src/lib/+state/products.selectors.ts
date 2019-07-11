import { ProductsState } from './products.reducer';

export const getProducts = ({ products }: ProductsState) => products;

export const getProduct = ({ products }: ProductsState, productId: string) => {
  return products.find(product => product.id === productId);
};
