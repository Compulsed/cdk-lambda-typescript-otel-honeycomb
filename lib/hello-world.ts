import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';

export class HelloWorld extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    
    const table = new Table(scope, 'example-table', {
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING
      }
    })

    const helloFunction = new NodejsFunction(this, 'function', {
        runtime: Runtime.NODEJS_16_X,
        architecture: Architecture.ARM_64,
        memorySize: 1024,
        environment: {
          // Required for layer
          AWS_LAMBDA_EXEC_WRAPPER: '/opt/otel-handler',
          OPENTELEMETRY_COLLECTOR_CONFIG_FILE: '/var/task/collector.yaml',

          // Required to for HNY
          OTEL_PROPAGATORS: 'tracecontext',
          OTEL_SERVICE_NAME: 'demo-example-service',

          // Standard environment variable
          DDB_TABLE_NAME: table.tableName
        },
        layers: [
          // From https://github.com/aws-observability/aws-otel-lambda
          lambda.LayerVersion.fromLayerVersionArn(
            this,
            'otel-layer',
            'arn:aws:lambda:us-east-1:901920570463:layer:aws-otel-nodejs-arm64-ver-1-7-0:2'
          ),
        ],
        // Ignores AWS Lambda services' OTEL traces
        tracing: lambda.Tracing.PASS_THROUGH,
        bundling: {
            keepNames: true,
            nodeModules: [
              // For Otel's auto-instrumentation to work the package must be in node modules
              // Packages that autoinstrumentation will work on https://www.npmjs.com/package/@opentelemetry/auto-instrumentations-node
              '@aws-sdk/client-dynamodb',            
            ],
            externalModules: [
              // Do not deploy, runtime function will use these values from the layer
              //  we have these deps in our package.json so that we can add
              //  OTel types to code + use honeycomb for local invokes of the lambda function
              '@opentelemetry/api',
              '@opentelemetry/sdk-node',
              '@opentelemetry/auto-instrumentations-node',
            ],
            commandHooks: {
                // AWS Otel lambda, this for otel configuration
                beforeBundling(inputDir: string, outputDir: string): string[] {
                  return [`cp ${inputDir}/collector.yaml ${outputDir}`]
                },
                afterBundling(): string[] {
                  return []
                },
                beforeInstall() {
                  return []
                },
            },
        }        
    });

    table.grantReadWriteData(helloFunction)
    
    new LambdaRestApi(this, 'apigw', {
      handler: helloFunction,
    });

  }
}
