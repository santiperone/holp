// TODO: find a more suitable logging library.
import {APIGatewayProxyResult} from 'aws-lambda';
import {HTTPError, InternalServerError} from '../errors';
import {withAPIGatewayOptions} from '../proxies';

type Body = object | undefined | null;

function isEmpty(value: Body) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === 'object' && Object.keys(value).length === 0)
  );
}

export interface APIGatewayResponse {
  body?: Body;
  headers?: APIGatewayProxyResult['headers'];
  statusCode?: number;
  isBase64Encoded?: boolean;
}

/**
 * Generate a response for API Gateway Proxy Integration.
 */
export function responseFactory(
  res: APIGatewayResponse,
  options: withAPIGatewayOptions = {},
): APIGatewayProxyResult {
  const logger = options.logger;
  const body = res.body !== undefined ? res.body : res;
  const statusCode = res.statusCode;
  const headers: Record<string, string | number | boolean> = {
    'Content-Type': 'application/json',
    ...res.headers,
  };
  if (options.cors?.origin || process.env.CORS_ORIGIN) {
    headers['Access-Control-Allow-Origin'] =
      options.cors?.origin || (process.env.CORS_ORIGIN as string); // This won't be undefined because of the if statement above.
  }
  if (options.cors) {
    if (options.cors?.allowCredentials) {
      headers['Access-Control-Allow-Credentials'] =
        options.cors.allowCredentials;
    }
  }

  const response = {
    statusCode: statusCode ? statusCode : isEmpty(body) ? 204 : 200,
    headers,
    body,
    isBase64Encoded: res.isBase64Encoded,
  };

  if (Number(response.statusCode) < 400) {
    logger?.info({
      msg: '[RESPONSE]',
      response: {...response, body: '****'},
    });
  } else {
    logger?.error({msg: '[RESPONSE_ERROR]', response});
  }

  return {
    ...response,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
}

/**
 * Generate an error response for API Gateway Proxy Integration.
 */
export function errorFactory(
  error: unknown,
  options: withAPIGatewayOptions = {},
): APIGatewayProxyResult {
  const logger = options.logger;
  logger?.error(error as Error);
  const responseError =
    error instanceof HTTPError
      ? error
      : new InternalServerError('Unidentified server error', {
          cause: error,
        });
  const {message, code, statusCode} = responseError;
  const body = {message, code};

  return responseFactory({body, statusCode}, {logger});
}
