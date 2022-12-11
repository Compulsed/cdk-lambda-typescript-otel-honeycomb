# Cdk lambda Typescript OTEL Honeycomb

**Purpose:**

This project is meant to demonstrate how to export (automatic + manual) traces from lambda to honeycomb. The reason we cannot just use standard library (@opentelemetry/api) / exporter (and why we must use a layer) is because lambda does not flush the traces after an invoke. This will lead to missing telemetry data.

![Example Trace](./images/trace.png)

**Why does this demo project exist?**

Getting AWS' Lambda layer to work CDK + Honeycomb is hard.
1. CDK uses ESbuild -- OTel's auto-instrumentation requires certain values be modifiable / be layed out a particular way
1. The [aws-otel-lambda](https://github.com/aws-observability/aws-otel-lambda) is designed to work with XRay
1. [Honeycomb](https://docs.honeycomb.io/getting-data-in/aws/aws-lambda/) recommends aws-otel-lambda, but does not provide a detailed guide on how to set it up

**Set-up demo project**

1. Copy + Paste `collector-template.yaml` to `collector.yaml`
1. Replace `xxx` in `collector.yaml` to your honeycomb keys
1. `npm install` -- Installs dependencies
1. `npx cdk deploy` -- Deploys the stack NOTE: Must use us-east-1 as this is where the layer is
1. Hit the URL that CDK outputs from the deployment. You should see a counter
1. Review honeycomb, your traces should be present

**How to use this demo**

This demo project is a reference for the simplest possible set up. Review the /lib directory for changes you will need to make to your application.

**Improvements to this project**

- startActiveSpan types (decorator)
- Add types to OTel (difficult due to require rather an import)
- Update the layer to pull from deployment region