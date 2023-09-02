import {APIGatewayProxyEvent, APIGatewayProxyEventHeaders} from 'aws-lambda';
import {APIGatewayParsedEvent} from '../proxies';
import {UnsupportedMediaTypeError} from '../errors';

export class HolpHeaders {
  constructor(private headers: APIGatewayProxyEventHeaders) {
    this.headers = Object.fromEntries(
      Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]),
    );
  }
  get(key: string) {
    return this.headers[key.toLowerCase()];
  }
  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.headers;
  }
}

const jsonMimePattern = /^application\/(.+\+)?json($|;.+)/;

export const parseEvent = <TEvent extends APIGatewayParsedEvent>(
  event: APIGatewayProxyEvent,
): TEvent => {
  const rawHeaders = event.headers || {};
  const headers = new HolpHeaders(rawHeaders);
  const contentType = headers.get('Content-Type');
  let body = event.body;
  if (jsonMimePattern.test(contentType ?? '')) {
    try {
      const data =
        body && event.isBase64Encoded
          ? Buffer.from(body, 'base64').toString()
          : body;
      body = JSON.parse(data ?? '{}');
    } catch (error) {
      throw new UnsupportedMediaTypeError('Invalid or malformed JSON');
    }
  }

  const parsedEvent = {
    ...event,
    headers,
    body,
    queryStringParameters: event.queryStringParameters || {},
    pathParameters: event.pathParameters || {},
  } as TEvent;
  return parsedEvent;
};
