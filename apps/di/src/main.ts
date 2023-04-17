import { Injectable } from '@wikia/dependency-injection';
import { DepClass } from './dep';

@Injectable()
export class MainClass {
  constructor(public dep: DepClass) {}
}
