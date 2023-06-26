# HOLP (Higer-Order Lambda Proxies)
`holp` is a library that simplifies common AWS Lambda patterns, reducing boilerplate code and promoting best practices. It facilitates consistent error handling and wraps our handler using a higher-order function approach. The name "holp" stands for "Higher-Order Lambda Proxy," drawing inspiration from the concept of Higher-Order Components (HOC) in React. Think of holp as a HOC for Lambda handlers, streamlining response management and error handling for more efficient and consistent serverless development.
## Usage
### API Gateway
In a typical lambda that works with API Gateway, the handler's logic could look something like this:

```typescript
import { APIGatewayEvent } from "aws-lambda";
import logger from 'my-logging-library';
  
logger.debug = Boolean(process.env.DEBUG);

export const handler = async (event: APIGatewayEvent) => {
  try {
    logger.debug('START', event);
    const body = JSON.parse(event.body);
    const someParam = body.someParam;
    const someQueryParam = event.queryStringParameters?.someQueryParam;
    logger.info('Some insightful log message.')
    const result = await someAsyncTask(someParam, someQueryParam);
    if (result.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Result does not exist.",
        }),
      }
    }
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    }
  } catch (error) {
    logger.error(error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error message.",
      }),
    }
  }
}
```
In a proyect with several lambda functions, we can easily imagine how this pattern is repeated quite often. To avoid this, we can take advantage of 'withAPIGateway' proxy. This is nothing more than a HOF that will handle the return and exceptions of our handler using both the responseFactory and the errorFactory, and also parses the body of the event in case it exists, and returns an empty object by default in queryStringParameters and pathParameters, to avoid errors due to undefined.

```typescript
import { APIGatewayEvent } from "aws-lambda";
import { withApiGateway, ApiGatewayParsedEvent } from "holp";
import { BadRequestError } from "holp/errors";
import logger from 'my-logging-library';

interface MyEvent extends ApiGatewayParsedEvent {
  body: {
    someParam: string,
  },
  queryStringParameters: {
    someQueryParam: string,
  }
};

export const myLambdaFunction = async (event: MyEvent) => {
  const someParam = event.body.someParam;
  const someQueryParam = event.queryStringParameters.someQueryParam;
  logger.info('Some insightful log message.')
  const result = await someAsyncTask(someParam, someQueryParam);
  if (result.length === 0) {
    throw new BadRequestError("Result does not exist.");
  }
  return { result }
}

export const Handler = withAPIGateway(myLambdaFunction, { logger });
```

In case any exceptions are thrown, the proxy will handle them and return a response with the corresponding status code and message. If the exception is not of the type 'HTTPError', it will be wrapped in an InternalServerError.

As we can see, our Handler is much cleaner, and we avoid repeating the same logic over and over again.

## Error Handling
The library exports some common HTTP Errors as classes that extend the native javascript Error class. This gives us much cleaner code and allows us to keep the stack trace of the errors thrown by our application.

```typescript
import { withAPIGateway, APIGatewayParsedEvent } from 'holp';
import {
  BadGatewayError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from 'holp/errors';

export const myLambda = async (event: APIGatewayParsedEvent) => {
  // Bad request, con un status code 400:
  throw new BadRequestError('Invalid params.');
  // Unauthorized, con un status code 401:
  throw new UnauthorizedError('Invalid user.');
  // Forbidden, con un status code 403:
  throw new ForbiddenError('Invalid user.');
  // Not found, con un status code 404:
  throw new NotFoundError('Invalid user.');
  // Conflict, con un status code 409:
  throw new ConflictError('Invalid user.');
  // Internal server error, con un status code 500:
  throw new InternalServerError('Invalid user.');
  // Bad gateway, con un status code 502:
  throw new BadGatewayError('Invalid user.');
};

export const Handler = withAPIGateway(myLambda);
```
Furthermore, we can create our own errors by extending the HTTPError class. This allows us to define our own error catalog for our application, and have more insight into what is happening with our application. For example, if we had to validate a transaction, we could do the following:

```typescript
import { ApiGateWayResponseProxy, APIGatewayParsedEvent } from 'holp';
import { BadRequestError } from 'holp/errors';

class InvalidTransactionError extends BadRequestError {
  constructor(transactionId: string) {
    super(`Invalid transaction id: ${transactionId}`);
  }
}

interface MyEvent extends APIGatewayParsedEvent {
  pathParameters: {
    transactionId: string;
  }
};

export const domain = async (event: MyEvent) => {
  const { transactionId } = event.pathParameters;
  if (!isValidTransactionId(transactionId)) {
    throw new InvalidTransactionError(transactionId);
  }
  return { body: { transactionId } };
};

export const Handler = ApiGateWayResponseProxy(domain);
```
