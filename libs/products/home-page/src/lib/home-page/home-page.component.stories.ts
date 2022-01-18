import { moduleMetadata, Story, Meta } from '@storybook/angular';
import { HomePageComponent } from './home-page.component';

export default {
  title: 'HomePageComponent',
  component: HomePageComponent,
  decorators: [
    moduleMetadata({
      imports: [],
    })
  ],
} as Meta<HomePageComponent>;

const Template: Story<HomePageComponent> = (args: HomePageComponent) => ({
  component: HomePageComponent,
  props: args,
});


export const Primary = Template.bind({});
Primary.args = {
}