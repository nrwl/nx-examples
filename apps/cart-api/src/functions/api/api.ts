// @ts-expect-error - when running serverless this will have a default export
import init from '../../main';
import { Handler } from '@netlify/functions';
import awsLambdaFastify from '@fastify/aws-lambda';

// Setup serverless functionality for api.
// Note: Netlify deploys this function at the endpoint /.netlify/functions/api
// so we prefix all routes with /.netlify/functions to ensure fastify still works correctly when running with netlify
export const handler: Handler = awsLambdaFastify(init('/.netlify/functions'));
