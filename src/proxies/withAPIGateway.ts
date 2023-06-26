import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventHeaders,
  APIGatewayProxyEventPathParameters,
  APIGatewayProxyEventQueryStringParameters,
  Context,
} from 'aws-lambda';
import { parseEvent } from '../utils/APIGatewayRequest';
import {
  Logger,
  APIGatewayResponse,
  responseFactory,
  errorFactory,
} from '../utils/APIGatewayResponse';

export interface APIGatewayParsedEvent
  extends Omit<APIGatewayProxyEvent, 'body'> {
  body: unknown;
  queryStringParameters: APIGatewayProxyEventQueryStringParameters;
  pathParameters: APIGatewayProxyEventPathParameters;
  rawHeaders: APIGatewayProxyEventHeaders;
}

type Handler<TEvent> = (
  event: TEvent,
  context: Context
) => Promise<APIGatewayResponse>;

export interface withAPIGatewayOptions {
  logger?: Logger;
  cors?: boolean;
}

/**
 * Higher Order Function that wraps your lambda handler code running
 * through API Gateway and handles parameter parsing and try/catch logic using
 * the response and error factories.
 *
 * @param handler - Your lambda handler function
 * @param options - Options for the wrapper
 * @param options.logger - A logger instance
 * @param options.cors - Whether to add CORS headers to the response
 * @returns A lambda handler function
 */
export function withAPIGateway<TEvent extends APIGatewayParsedEvent>(
  handler: Handler<TEvent>,
  options: withAPIGatewayOptions = {}
) {
  return async function (event: APIGatewayProxyEvent, context: Context) {
    try {
      options.logger?.debug(event, 'START');
      const parsedEvent = parseEvent<TEvent>(event);
      const response = await handler(parsedEvent, context);
      return responseFactory(response, options);
    } catch (error) {
      return errorFactory(error, options);
    }
  };
}
