import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

// Must use require as we are using the `opentelemetry` provided by the layer
//  Require causes 'any', we can add the types back via import type
const { trace, SpanStatusCode } = require('@opentelemetry/api')
import type { Span, SpanOptions } from '@opentelemetry/api'

const tracer = trace.getTracer('my-service-tracer')

const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

// Acts like a decorator, helps reduce nesting that comes from 'startActiveSpan'
function spanify<F extends (args: Parameters<F>[0]) => ReturnType<F>>(
    fn: F,
    spanOptions: SpanOptions = {},
    spanName: string = fn.name.replace(/^_/, '')
  ): (args: Omit<Parameters<F>[0], 'span'>) => Promise<ReturnType<F>> {
    return (functionArgs) => {
      return tracer.startActiveSpan(spanName, spanOptions, async (span: Span): Promise<ReturnType<F>> => {
        try {
          const result = await fn({ ...functionArgs, span })
          
          span.setStatus({
            code: SpanStatusCode.OK,
          })
          
          return result
        } catch (error: any) {
          const errorMessage = String(error)
  
          if (!error.spanExceptionRecorded) {
            span.recordException(error)
            span.setStatus({ code: SpanStatusCode.ERROR, message: errorMessage })
            error.spanExceptionRecorded = true
          }
  
          throw error
        } finally {
          span.end()
        }
      })
    }
  }
  
const COUNTER_KEY = 'counter'

const getCount = spanify(async function getCounter({ span }: { span: Span }): Promise<number> {
    const data = await ddbDocClient.send(new GetCommand({
        TableName: process.env.DDB_TABLE_NAME,
        Key: {
            id: COUNTER_KEY
        }
    }));

    const currentCount = data?.Item?.count || 0

    span.setAttributes({ currentCount })

    return currentCount
})

const incrementPersistCount = spanify(async function saveCount({ currentCount, span }: { currentCount: number, span: Span }): Promise<number> {
    const newCount = currentCount + 1

    span.setAttributes({ newCount })

    await ddbDocClient.send(new PutCommand({
        TableName: process.env.DDB_TABLE_NAME,
        Item: {
            id: COUNTER_KEY,
            count: newCount
        }
    }));

    return newCount
})


const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    console.log(`Event: ${JSON.stringify(event, null, 2)}`);
    console.log(`Context: ${JSON.stringify(context, null, 2)}`);

    // Requires 'root: true', to override the otel trace from the lambda service (avoids missing span problem in HNY)
    // Also an example of usage of the 'startActiveSpan'
    return tracer.startActiveSpan('handler', { root: true }, async (span: any) => {
        const currentCount = await getCount({})

        const newCount = await incrementPersistCount({ currentCount })

        const response =  {
            statusCode: 200,
            body: JSON.stringify({
                newCount,
            }),
        };

        span.end()

        return response
    })
};

// Must export via handler, required due to otel manipulating lambda entry point
//  https://github.com/open-telemetry/opentelemetry-js/issues/1946
module.exports = { handler }