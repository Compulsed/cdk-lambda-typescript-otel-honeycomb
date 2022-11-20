Useful Repos repo:

- https://github.com/aws-observability/aws-otel-lambda
- https://github.com/open-telemetry/opentelemetry-lambda/ (Auto intrum layer)
- https://github.com/open-telemetry/opentelemetry-js-contrib

Github issues:
- https://github.com/open-telemetry/opentelemetry-js-contrib/issues/647#issuecomment-982258484
- https://github.com/aws-observability/aws-otel-lambda/issues/228 (localhost export) <- Here

Manual Instrumentation:

- https://aws-otel.github.io/docs/getting-started/js-sdk/trace-manual-instr <- Here


More places:
- Honeycomb otel slack
- Honeycomb-opentelemetry-node -- https://honeycombpollinators.slack.com/archives/CNQ943Q75/p1668617521349559?thread_ts=1668606347.932139&cid=CNQ943Q75


Guides:
- https://opentelemetry.io/docs/instrumentation/js/getting-started/nodejs/
- https://opentelemetry.io/docs/instrumentation/js/instrumentation/
- https://docs.honeycomb.io/getting-data-in/opentelemetry/javascript/ (best doc?)

Approaches:
- Localhost attempt
- Do not bundle otel, rely on bundle.