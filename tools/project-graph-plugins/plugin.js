const { ProjectGraphBuilder } = require('@nrwl/devkit');

exports.processProjectGraph = (graph, context) => {
  const builder = new ProjectGraphBuilder(graph);
  return builder.getUpdatedProjectGraph();
};
