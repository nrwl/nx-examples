import { Injectable } from '@wikia/dependency-injection';

@Injectable()
export class DepClass {
  foo() {
    return 'foo';
  }
}
