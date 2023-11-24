import { NonProjectComponent } from './non-project.component';

describe('BreadcrumbsComponent', () => {
  let comp: NonProjectComponent;

  beforeEach(() => {
    comp = new NonProjectComponent();
  });

  it('instantiates successfully', () => {
    expect(comp).toBeTruthy();
  });
});
