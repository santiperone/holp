import {Context} from 'aws-lambda';

export type Handler<TEvent, TResponse> = (
  event: TEvent,
  context: Context,
) => Promise<TResponse>;
