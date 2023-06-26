import { APIGatewayProxyEvent, APIGatewayProxyEventHeaders } from 'aws-lambda';
import { APIGatewayParsedEvent } from 'proxies';

function caseInsensitiveHeaders(target: APIGatewayProxyEventHeaders) {
  const proxy = new Proxy(
    {},
    {
      get: (obj: APIGatewayProxyEventHeaders, key: string) =>
        obj[key.toLowerCase()],
      set: (obj: APIGatewayProxyEventHeaders, key: string, value: string) => {
        obj[key.toLowerCase()] = value;
        return true;
      },
    }
  );
  return Object.assign(proxy, target);
}

export const parseEvent = <TEvent extends APIGatewayParsedEvent>(
  event: APIGatewayProxyEvent
): TEvent => {
  const rawHeaders = event.headers || {};
  const parsedEvent = {
    ...event,
    rawHeaders,
    headers: caseInsensitiveHeaders(rawHeaders),
    body: event.body ? JSON.parse(event.body) : {},
    queryStringParameters: event.queryStringParameters || {},
    pathParameters: event.pathParameters || {},
  } as TEvent;
  return parsedEvent;
};
