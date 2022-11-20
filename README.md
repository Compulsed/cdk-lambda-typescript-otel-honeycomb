# Serverless CDK Otel

**Purpose:**

This project is meant to demonstrate how to export (automatic + manual) traces from lambda to honeycomb. The reason we cannot just use standard exporter (and why we must use a layer) is because lambda does not flush the traces after an invoke. 

There are multiple ways reliably get traces from Lambda to OTEL services:
- Use cloudwatch logs as a transport and then have a lambda subscription subscribe to the log stream
- Use lambda extensions and a lambda layer -- this is what this demo project is meant to show

**Project status**

What works
- Automatic tracing

What does not work:
- Manual tracing, I think we should be able to reference the Otel libraries provided by the layer though I cannot get this to work with ESBuild
- Honeycomb does not have the root traces, I think this is because the root traces are coming from (Lambda / APIGW) xray information that is not exported to HNY

To deploy:
- npm install
- Move `collector-template.yaml` to `collector.yaml`
- Replace xxx with honeycomb keys
- `npx cdk deploy`

Attempts to get extensions working:
- ❌ Deploying our own OTEL libraries, and setting specifying the exporter as localhost -- Does not appear to send any data to HNY
- ⚠️ Excluding our own OTEL Libraries (depending on the layer) -- ESBuild does not appear to allow us to reference those libraries (there might be a way you are meant to do this with layers?)

## Information

Useful Repos repo:

- https://github.com/open-telemetry/opentelemetry-js-contrib -- OTel JS
- https://github.com/aws-observability/aws-otel-lambda -- the layer we're using
- https://github.com/open-telemetry/opentelemetry-lambda/ -- lambda layer OTEL provides

Relevant Github issues:

- https://github.com/open-telemetry/opentelemetry-js-contrib/issues/647#issuecomment-982258484 -- Example of someone using CDK ESBuild to work with OTel (they must be referencing the layers' otel library because they're 'externalModules')
- https://github.com/open-telemetry/opentelemetry-js-contrib/issues/647#issuecomment-1006213667 ESbuild examples (have not tried this yet)
- https://github.com/aws-observability/aws-otel-lambda/issues/228 (examples of of the opentelmetry library working, though there's a large performance impact)

Manual Instrumentation:

- https://aws-otel.github.io/docs/getting-started/js-sdk/trace-manual-instr <- Here


More places for information:
- Honeycomb otel slack
- Honeycomb-opentelemetry-node -- https://honeycombpollinators.slack.com/archives/CNQ943Q75/p1668617521349559?thread_ts=1668606347.932139&cid=CNQ943Q75


Guides:
- https://opentelemetry.io/docs/instrumentation/js/getting-started/nodejs/
- https://opentelemetry.io/docs/instrumentation/js/instrumentation/
- https://docs.honeycomb.io/getting-data-in/opentelemetry/javascript/ (best doc?)