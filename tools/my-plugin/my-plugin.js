const { ProjectGraphBuilder } = require('@nrwl/devkit');

console.log('loaded');

exports.processProjectGraph = (graph, context) => {
  console.log('run');
  const builder = new ProjectGraphBuilder(graph);

  return builder.getUpdatedProjectGraph();
};
