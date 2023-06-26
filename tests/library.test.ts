import {
  BadRequestError,
} from '../src/errors/http';
import { responseFactory, errorFactory } from '../src/utils/APIGatewayResponse';
import { withAPIGateway } from '../src/proxies';
import { fromPartial } from '@total-typescript/shoehorn';

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('responseFactory', () => {

  it('should create a 204 response for empty body', () => {
    const content = { body: {} };
    const response = responseFactory(content);
    expect(response.statusCode).toBe(204);
    expect(response.body).toBeDefined();
    expect(JSON.parse(response.body)).toEqual(content.body);
  });

  it('should create a 204 response for undefined body', () => {
    const content = {};
    const response = responseFactory(content);
    expect(response.statusCode).toBe(204);
  });

  it('should create a 204 response for null body', () => {
    const content = { body: null };
    const response = responseFactory(content);
    expect(response.statusCode).toBe(204);
    expect(response.body).toBeDefined();
    expect(JSON.parse(response.body)).toEqual(content.body);
  });

  it('should parse HTTPError instances into valid response', () => {
    const customError = new BadRequestError('custom error');

    const response = errorFactory(customError);
    expect(response.statusCode).toBe(customError.statusCode);

    expect(response.body).toBeDefined();
    const body = JSON.parse(response.body);

    expect(body.error.code).toBe(customError.code);
    expect(body.error.message).toBe(customError.message);
  });
});

describe('withAPIGateway', () => {
  it('should return a 200 response', async () => {
    const handler = async () => {
      return { body: { message: 'success' } };
    };
    const proxy = withAPIGateway(handler);
    const response = await proxy(fromPartial({}), fromPartial({}));
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
    expect(JSON.parse(response.body)).toEqual({ message: 'success' });
  });

  it('should parse request body', async () => {
    const rawBody = '{"id": "123"}';
    const handler = jest.fn();
    const proxy = withAPIGateway(handler);
    await proxy(fromPartial({ body: rawBody }), fromPartial({}));
    expect(handler.mock.calls[0][0].body).toStrictEqual({ id: '123' });
  });

  it('should proxy request headers', async () => {
    const rawHeaders = {
      Authorization: 'Bearer 123',
    };
    const handler = jest.fn();
    const proxy = withAPIGateway(handler);
    await proxy(fromPartial({ headers: rawHeaders }), fromPartial({}));
    expect(handler.mock.calls[0][0].rawHeaders).toEqual(rawHeaders);
    expect(handler.mock.calls[0][0].headers.authorization).toEqual(rawHeaders.Authorization);
  });

  it('should return an error response', async () => {
    const handler = async () => {
      throw new Error('any error');
    };
    const proxy = withAPIGateway(handler);
    const response = await proxy(fromPartial({}), fromPartial({}));
    expect(response.statusCode).toBe(500);
    expect(response.body).toBeDefined();
    const body = JSON.parse(response.body);
    expect(body.error.message).toBe('Hubo un error no identificado');
  });

  it('should generate success logs', async () => {
    const handler = async () => {
      return { body: { message: 'success' } };
    };
    const proxy = withAPIGateway(handler, { logger: mockLogger });
    await proxy(fromPartial({}), fromPartial({}));
    expect(mockLogger.debug).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it('should generate error logs', async () => {
    const handler = async () => {
      throw new Error('any error');
    };
    const proxy = withAPIGateway(handler, { logger: mockLogger });
    await proxy(fromPartial({}), fromPartial({}));
    expect(mockLogger.debug).toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalled();
  });
});