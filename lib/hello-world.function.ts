
import * as opentelemetry from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { trace, diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

const sdk = new opentelemetry.NodeSDK({
  // optional - default url is http://localhost:4318/v1/traces
  traceExporter: new OTLPTraceExporter({}),
  instrumentations: [getNodeAutoInstrumentations()]
});

sdk.start()

const tracer = trace.getTracer('my-service-tracer')

import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager'

const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    console.log(`Event: ${JSON.stringify(event, null, 2)}`);
    console.log(`Context: ${JSON.stringify(context, null, 2)}`);

    return tracer.startActiveSpan('custom-handler', async (span) => {
        const secretsManagerClient = new SecretsManagerClient({ region: 'us-east-1' })

        const command = new GetSecretValueCommand({
            SecretId: 'DbClusterSecret9A4B0D5E-u27xQsOk1a4V',
        })

        const secret = await secretsManagerClient.send(command)

        const response =  {
            statusCode: 200,
            body: JSON.stringify({
                message: 'hello world',
                secret: JSON.stringify({ secret }, null, 2)
            }),
        };

        span.end()

        return response
    })
};

module.exports = { handler }