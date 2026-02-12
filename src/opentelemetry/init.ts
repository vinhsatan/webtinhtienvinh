// Lightweight OpenTelemetry initializer. Tries to load SDK if available.
export async function initTelemetry() {
  if (process.env.ENABLE_OTEL !== 'true') {
    // No-op when not enabled
    return { shutdown: async () => {} };
  }

  try {
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
    const { Resource } = await import('@opentelemetry/resources');
    const { SemanticResourceAttributes } = await import('@opentelemetry/semantic-conventions');

    const exporter = new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || undefined,
    });

    const sdk = new NodeSDK({
      resource: new Resource({ [SemanticResourceAttributes.SERVICE_NAME]: process.env.SERVICE_NAME || 'orchestrator' }),
      traceExporter: exporter,
    } as any);

    await sdk.start();
    // eslint-disable-next-line no-console
    console.log('OpenTelemetry initialized');

    return {
      shutdown: async () => {
        try {
          await sdk.shutdown();
          // eslint-disable-next-line no-console
          console.log('OpenTelemetry shutdown complete');
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('OTel shutdown error', e);
        }
      },
    };
  } catch (err) {
    // SDK not installed or failed — fallback gracefully
    // eslint-disable-next-line no-console
    console.warn('OpenTelemetry SDK not available or failed to init:', err?.message || err);
    return { shutdown: async () => {} };
  }
}

export default { initTelemetry };
