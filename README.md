# Serverless CDK Otel

**Purpose:**

This project is meant to demonstrate how to export (automatic + manual) traces from lambda to honeycomb. The reason we cannot just use standard exporter (and why we must use a layer) is because lambda does not flush the traces after an invoke. This leads to missing traces

![Example Trace](./images/trace.png)

**Set-up**

1. Copy + Paste `collector-template.yaml` to `collector.yaml`
1. Replace `xxx` in `collector.yaml` to your honeycomb keys
1. `npm install` -- Installs dependencies
1. `npx cdk deploy` -- Deploys the stack NOTE: Must use us-east-1 as this is where the layer is
1. Hit the URL that CDK outputs from the deployment. You should see a counter
1. Review honeycomb, your traces should be present

**Why is this so hard to setup?**

There are comments throughout the code which describes why each section is required. I think the reason that this is so hard to configure is that we are relying on an AWS extension to export data to a 3rd party (Honeycomb) AND we need to ensure that ESBuild (what CDK uses to compile TS Lambdas) to correctly layout our code for instrumentation.

**TODO:**

- startActiveSpan types (decorator)
- Add types to OTel (difficult due to require rather an import)
- Update the layer to pull from deployment region