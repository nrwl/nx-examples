import { Story, Meta } from '@storybook/react';
import {
  TestStorybookSuccess,
  TestStorybookSuccessProps,
} from './test-storybook-success';

export default {
  component: TestStorybookSuccess,
  title: 'TestStorybookSuccess',
} as Meta;

const Template: Story<TestStorybookSuccessProps> = (args) => (
  <TestStorybookSuccess {...args} />
);

export const Primary = Template.bind({});
Primary.args = {};
