import { logs } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";

const environment = (process.env.ENV || process.env.NODE_ENV || "dev").toLowerCase();
const serviceName = process.env.OTEL_SERVICE_NAME || "letshost-backend";

export const telemetryEnabled = !["dev", "development"].includes(environment);

const getLogsEndpoint = () => {
  if (process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT) {
    return process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT;
  }

  if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    const baseEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT.replace(/\/+$/, "");
    return `${baseEndpoint}/v1/logs`;
  }

  return "http://localhost:4318/v1/logs";
};

const parseHeaders = (rawHeaders) => {
  if (!rawHeaders) {
    return undefined;
  }

  const parsedHeaders = {};

  for (const item of rawHeaders.split(",")) {
    const [key, ...valueParts] = item.split("=");
    if (!key || valueParts.length === 0) {
      continue;
    }

    parsedHeaders[key.trim()] = valueParts.join("=").trim();
  }

  return Object.keys(parsedHeaders).length > 0 ? parsedHeaders : undefined;
};

let provider = null;
export let telemetryLogger = null;
const parsedExporterHeaders = parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS);
const resolvedLogsEndpoint = telemetryEnabled ? getLogsEndpoint() : null;

export const telemetryDiagnostics = {
  enabled: telemetryEnabled,
  logsEndpoint: resolvedLogsEndpoint,
  headersConfigured: Boolean(parsedExporterHeaders),
};

if (telemetryEnabled) {
  const exporter = new OTLPLogExporter({
    url: resolvedLogsEndpoint,
    headers: parsedExporterHeaders,
  });

  provider = new LoggerProvider({
    resource: resourceFromAttributes({
      "service.name": serviceName,
      "deployment.environment": environment,
    }),
    processors: [new BatchLogRecordProcessor(exporter)],
  });

  logs.setGlobalLoggerProvider(provider);
  telemetryLogger = logs.getLogger("backend-pino");
}

export const shutdownTelemetry = async () => {
  if (!provider) {
    return;
  }

  try {
    await provider.shutdown();
  } catch (error) {
    process.stderr.write(`Telemetry shutdown failed: ${error.message}\n`);
  }
};
