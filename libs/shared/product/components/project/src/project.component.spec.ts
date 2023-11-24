import { ProjectComponent } from './project.component';

describe('BreadcrumbsComponent', () => {
  let comp: ProjectComponent;

  beforeEach(() => {
    comp = new ProjectComponent();
  });

  it('instantiates successfully', () => {
    expect(comp).toBeTruthy();
  });
});
