// TODO: find a more suitable logging library.
import { APIGatewayProxyResult } from 'aws-lambda';
import { HTTPError, InternalServerError } from '../errors';
import { withAPIGatewayOptions } from '../proxies';

type Body = object | undefined | null;

function isEmpty(value: Body) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === 'object' && Object.keys(value).length === 0)
  );
}

export interface Logger {
  trace?: (...content: any[]) => void;
  debug: (...content: any[]) => void;
  info: (...content: any[]) => void;
  warn: (...content: any[]) => void;
  error: (...content: any[]) => void;
}
export interface APIGatewayResponse {
  body?: Body;
  statusCode?: number;
}

/**
 * Generate a response for API Gateway Proxy Integration.
 */
export function responseFactory(
  res: APIGatewayResponse,
  options: withAPIGatewayOptions = {}
): APIGatewayProxyResult {
  const logger = options.logger;
  const body = res.body !== undefined ? res.body : res;
  const statusCode = res.statusCode;
  const response = {
    statusCode: statusCode ? statusCode : isEmpty(body) ? 204 : 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    body,
    isBase64Encoded: false,
  };

  if (Number(response.statusCode) < 400) {
    logger?.info({
      msg: '[RESPONSE]',
      response: { ...response, body: '****' },
    });
  } else {
    logger?.error({ msg: '[RESPONSE_ERROR]', response });
  }

  return { ...response, body: JSON.stringify(body) };
}

/**
 * Generate an error response for API Gateway Proxy Integration.
 */
export function errorFactory(
  error: unknown,
  options: withAPIGatewayOptions = {}
): APIGatewayProxyResult {
  const logger = options.logger;
  logger?.error(error as Error);
  const responseError =
    error instanceof HTTPError
      ? error
      : new InternalServerError('Hubo un error no identificado', {
          cause: error,
        });
  const { message, code, statusCode } = responseError;
  const body = { error: { message, code } };

  return responseFactory({ body, statusCode }, { logger });
}
