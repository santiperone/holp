interface HttpErrorOptions {
  cause?: unknown;
  statusCode: number;
  code: string;
}

interface CustomHttpErrorOptions {
  cause?: unknown;
  code?: string;
}

/** HTTPError base class. Extend this class to generate custom error types that meet your business needs. */
export class HTTPError extends Error {
  statusCode: number;
  code: string;
  constructor(message: string, { statusCode, code, ...options }: HttpErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class BadRequestError extends HTTPError {
  constructor(message: string, options?: CustomHttpErrorOptions) {
    super(message, { code: 'BAD_REQUEST', ...options, statusCode: 400 });
  }
}

export class UnauthorizedError extends HTTPError {
  constructor(message: string, options?: CustomHttpErrorOptions) {
    super(message, { code: 'UNAUTHORIZED', ...options, statusCode: 401 });
  }
}

export class PaymentRequiredError extends HTTPError {
  constructor(message: string, options?: CustomHttpErrorOptions) {
    super(message, { code: 'BAD_REQUEST', ...options, statusCode: 402 });
  }
}

export class ForbiddenError extends HTTPError {
  constructor(message: string, options?: CustomHttpErrorOptions) {
    super(message, { code: 'FORBIDDEN', ...options, statusCode: 403 });
  }
}

export class NotFoundError extends HTTPError {
  constructor(message: string, options?: CustomHttpErrorOptions) {
    super(message, { code: 'NOT_FOUND', ...options, statusCode: 404 });
  }
}

export class NotAcceptableError extends HTTPError {
  constructor(message: string, options?: CustomHttpErrorOptions) {
    super(message, { code: 'NOT_ACCEPTABLE', ...options, statusCode: 406 });
  }
}

export class ConflictError extends HTTPError {
  constructor(message: string, options?: CustomHttpErrorOptions) {
    super(message, { code: 'CONFLICT', ...options, statusCode: 409 });
  }
}

export class UnsupportedMediaTypeError extends HTTPError {
  constructor(message: string, options?: CustomHttpErrorOptions) {
    super(message, {
      code: 'UNSUPPORTED_MEDIA_TYPE',
      ...options,
      statusCode: 415,
    });
  }
}

export class InternalServerError extends HTTPError {
  constructor(message: string, options?: CustomHttpErrorOptions) {
    super(message, { code: 'INTERNAL_SERVER_ERROR', ...options, statusCode: 500 });
  }
}

export class BadGatewayError extends HTTPError {
  constructor(message: string, options?: CustomHttpErrorOptions) {
    super(message, { code: 'BAD_GATEWAY', ...options, statusCode: 502 });
  }
}
