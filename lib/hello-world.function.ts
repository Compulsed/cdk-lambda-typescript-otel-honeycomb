import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

// Must use require as we are using the `opentelemetry` provided by the layer
//  We lose types by doing this, TODO: try and re-attach types
const api = require('@opentelemetry/api')
const tracer = api.trace.getTracer('my-service-tracer')

const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

const COUNTER_KEY = 'counter'

const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    console.log(`Event: ${JSON.stringify(event, null, 2)}`);
    console.log(`Context: ${JSON.stringify(context, null, 2)}`);

    return tracer.startActiveSpan('handler', { root: true }, async (span: any) => {
        let count = 0
        
        try {
            const data = await ddbDocClient.send(new GetCommand({
                TableName: process.env.DDB_TABLE_NAME,
                Key: {
                    id: COUNTER_KEY
                }
            }));

            count = data?.Item?.count || 0
        } catch (err) {
            // TODO: Specifically handle not found
            span.recordException(err);
        }

        ++count

        try {
            await ddbDocClient.send(new PutCommand({
                TableName: process.env.DDB_TABLE_NAME,
                Item: {
                    id: COUNTER_KEY,
                    count
                }
            }));
        } catch (err) {
            span.recordException(err);
        }

        const response =  {
            statusCode: 200,
            body: JSON.stringify({
                count,
            }),
        };

        span.end()

        return response
    })
};

// Must export via handler, required due to otel manipulates entry point
module.exports = { handler }