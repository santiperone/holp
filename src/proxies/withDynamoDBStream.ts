import {
  Context,
  DynamoDBBatchItemFailure,
  DynamoDBBatchResponse,
  DynamoDBRecord,
  DynamoDBStreamEvent,
  StreamRecord,
} from 'aws-lambda';
import {unmarshall} from '@aws-sdk/util-dynamodb';

import {Logger} from '../@types/logger';
import {Handler} from '../@types/handler';

export interface withDynamoDBStreamOptions {
  logger?: Logger;
  cors?: boolean;
}

export interface ParsedStreamRecord
  extends Omit<StreamRecord, 'Keys' | 'NewImage' | 'OldImage'> {
  Keys?: Record<string, unknown>;
  NewImage?: Record<string, unknown>;
  OldImage?: Record<string, unknown>;
}

export interface DynamoDBParsedRecord extends Omit<DynamoDBRecord, 'dynamodb'> {
  dynamodb?: ParsedStreamRecord;
}

export interface DynamoDBParsedStreamEvent
  extends Omit<DynamoDBStreamEvent, 'Records'> {
  Records: DynamoDBParsedRecord[];
}

const parseRecord = (record: DynamoDBRecord): DynamoDBParsedRecord => {
  return {
    ...record,
    dynamodb: {
      ...record.dynamodb,
      Keys: record.dynamodb?.Keys
        ? unmarshall(record.dynamodb.Keys)
        : undefined,
      NewImage: record.dynamodb?.NewImage
        ? unmarshall(record.dynamodb.NewImage)
        : undefined,
      OldImage: record.dynamodb?.OldImage
        ? unmarshall(record.dynamodb.OldImage)
        : undefined,
    },
  };
};

/**
 * Higher Order Function that wraps your lambda handler code running
 * through DynamoDB Stream in Promise.all and handles event unmarshalling and batch item failure reporting.
 *
 * @param handler - Your lambda handler function
 * @param options - Options for the wrapper
 * @param options.logger - A logger instance
 * @returns A lambda handler function
 */
export function withDynamoDBStream<TEvent extends DynamoDBParsedRecord>(
  handler: Handler<TEvent, void>,
  options: withDynamoDBStreamOptions = {},
) {
  return async function (
    event: DynamoDBStreamEvent,
    context: Context,
  ): Promise<DynamoDBBatchResponse | void> {
    options.logger?.debug({
      event,
      msg: 'START',
    });
    const batchItemFailures: DynamoDBBatchItemFailure[] = [];
    const promises = event.Records.map(async record => {
      const parsedRecord = parseRecord(record) as TEvent;
      try {
        await handler(parsedRecord, context);
      } catch (error) {
        batchItemFailures.push({
          itemIdentifier: record.dynamodb?.SequenceNumber || '0',
        });
      }
    });
    await Promise.all(promises);
    return batchItemFailures.length > 0 ? {batchItemFailures} : undefined;
  };
}

/**
 * Higher Order Function that wraps your lambda handler code running
 * through DynamoDB Stream in a single batch and handles event unmarshalling and batch item failure reporting.
 *
 * @param handler - Your lambda handler function
 * @param options - Options for the wrapper
 * @param options.logger - A logger instance
 * @returns A lambda handler function
 */
export function withDynamoDBStreamBatch<
  TEvent extends DynamoDBParsedStreamEvent,
>(handler: Handler<TEvent, void>, options: withDynamoDBStreamOptions = {}) {
  return async function (
    event: DynamoDBStreamEvent,
    context: Context,
  ): Promise<DynamoDBBatchResponse | void> {
    options.logger?.debug({
      event,
      msg: 'START',
    });
    const parsedEvent = {
      ...event,
      Records: event.Records.map(record => parseRecord(record)),
    } as TEvent;
    await handler(parsedEvent, context);
  };
}
