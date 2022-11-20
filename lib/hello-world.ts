import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import * as secretsManager from 'aws-cdk-lib/aws-secretsmanager'

export class HelloWorld extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const secret = secretsManager.Secret.fromSecretNameV2(this, 'Secret', 'DbClusterSecret9A4B0D5E-u27xQsOk1a4V')
    
    const helloFunction = new NodejsFunction(this, 'function', {
        runtime: Runtime.NODEJS_16_X,
        architecture: Architecture.ARM_64,
        memorySize: 1024,        
        environment: {
            AWS_LAMBDA_EXEC_WRAPPER: '/opt/otel-handler',
            OPENTELEMETRY_COLLECTOR_CONFIG_FILE: '/var/task/collector.yaml',
        },
        layers: [
            lambda.LayerVersion.fromLayerVersionArn(
              this,
              'otel-layer',
              'arn:aws:lambda:us-east-1:901920570463:layer:aws-otel-nodejs-arm64-ver-1-7-0:2'
            ),
        ],
        // Gives us basic automatic node tracing, though root span is missing
        tracing: lambda.Tracing.ACTIVE,
        bundling: {
            nodeModules: [


                // Turns https spans into secrets manager spans?
                '@aws-sdk/client-secrets-manager',
            ],

            externalModules: [
                // Required for 2 reasons
                //  - Fixes an issue with '@opentelemetry/sdk-node' -> thriftrw -> bufrw throwing an error on function initialization
                //  - OTEL does not work if `sdk-node` and `auto-instrumentations-node` are not included                
                '@opentelemetry/api',
                '@opentelemetry/sdk-node',
                '@opentelemetry/auto-instrumentations-node',
                '@opentelemetry/exporter-trace-otlp-proto',
                '@opentelemetry/exporter-trace-otlp-http',
            ],

            commandHooks: {
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

    secret?.grantRead(helloFunction)
    
    new LambdaRestApi(this, 'apigw', {
      handler: helloFunction,
    });

  }
}
