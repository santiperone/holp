import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventHeaders,
  APIGatewayProxyEventPathParameters,
  APIGatewayProxyEventQueryStringParameters,
  Context,
} from 'aws-lambda';
import {HolpHeaders, parseEvent} from '../utils/APIGatewayRequest';
import {
  Logger,
  APIGatewayResponse,
  responseFactory,
  errorFactory,
} from '../utils/APIGatewayResponse';

export interface APIGatewayParsedEvent
  extends Omit<APIGatewayProxyEvent, 'body' | 'headers'> {
  body: unknown;
  headers: HolpHeaders;
  queryStringParameters: APIGatewayProxyEventQueryStringParameters;
  pathParameters: APIGatewayProxyEventPathParameters;
  rawHeaders: APIGatewayProxyEventHeaders;
}

type Handler<TEvent> = (
  event: TEvent,
  context: Context,
) => Promise<APIGatewayResponse>;

interface CorsSettings {
  origin?: string;
  allowCredentials?: boolean;
}
export interface withAPIGatewayOptions {
  logger?: Logger;
  cors?: CorsSettings;
}

const defaultLogger: Logger = {
  debug: console.log,
  info: console.log,
  warn: console.log,
  error: console.log,
};

/**
 * Higher Order Function that wraps your lambda handler code running
 * through API Gateway and handles parameter parsing and try/catch logic using
 * the response and error factories.
 *
 * @param handler - Your lambda handler function
 * @param options - Options for the wrapper
 * @param options.logger - A logger instance (console.log by default)
 * @param options.cors - CORS configuration.
 * @returns A lambda handler function
 */
export function withAPIGateway<TEvent extends APIGatewayParsedEvent>(
  handler: Handler<TEvent>,
  options: withAPIGatewayOptions = {logger: defaultLogger},
) {
  return async function (event: APIGatewayProxyEvent, context: Context) {
    try {
      if (process.env.DEBUG === 'true') {
        options.logger?.debug({...event, msg: '[INCOMING_EVENT]'});
      }
      const parsedEvent = parseEvent<TEvent>(event);
      const response = await handler(parsedEvent, context);
      return responseFactory(response, options);
    } catch (error) {
      return errorFactory(error, options);
    }
  };
}
