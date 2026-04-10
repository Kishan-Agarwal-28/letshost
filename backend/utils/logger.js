import pino from "pino";
import pinoHttp from "pino-http";
import { SeverityNumber } from "@opentelemetry/api-logs";
import { telemetryEnabled, telemetryLogger } from "./telemetry.js";

const serviceName = process.env.OTEL_SERVICE_NAME || "letshost-backend";
const environment = (process.env.ENV || process.env.NODE_ENV || "dev").toLowerCase();

const pinoLevelToOtel = {
  trace: SeverityNumber.TRACE,
  debug: SeverityNumber.DEBUG,
  info: SeverityNumber.INFO,
  warn: SeverityNumber.WARN,
  error: SeverityNumber.ERROR,
  fatal: SeverityNumber.FATAL,
};

const numericLevelToPinoLevel = {
  10: "trace",
  20: "debug",
  30: "info",
  40: "warn",
  50: "error",
  60: "fatal",
};

const safeParseLog = (line) => {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
};

const toOtelAttributes = (payload) => {
  const attrs = {
    "service.name": serviceName,
    "deployment.environment": environment,
  };

  if (payload.req?.method) {
    attrs["http.request.method"] = payload.req.method;
  }

  if (payload.req?.url) {
    attrs["url.path"] = payload.req.url;
  }

  if (typeof payload.res?.statusCode === "number") {
    attrs["http.response.status_code"] = payload.res.statusCode;
  }

  if (typeof payload.responseTime === "number") {
    attrs["http.server.duration_ms"] = payload.responseTime;
  }

  if (payload.req?.id) {
    attrs["http.request.id"] = payload.req.id;
  }

  return attrs;
};

const otelPinoStream = {
  write(line) {
    if (!telemetryEnabled || !telemetryLogger) {
      return;
    }

    const payload = safeParseLog(line);
    if (!payload) {
      return;
    }

    const pinoLevel =
      typeof payload.level === "number"
        ? numericLevelToPinoLevel[payload.level]
        : payload.level;

    const normalizedLevel = pinoLevel && pinoLevelToOtel[pinoLevel] ? pinoLevel : "info";

    telemetryLogger.emit({
      severityNumber: pinoLevelToOtel[normalizedLevel],
      severityText: normalizedLevel.toUpperCase(),
      body: payload.msg || "application log",
      attributes: toOtelAttributes(payload),
      timestamp: payload.time,
    });
  },
};

const streams = [{ stream: process.stdout }];

if (telemetryEnabled) {
  streams.push({ stream: otelPinoStream });
}

export const appLogger = pino(
  {
    name: serviceName,
    level: process.env.LOG_LEVEL || "info",
  },
  pino.multistream(streams)
);

export const logger = pinoHttp({
  logger: appLogger,
  customLogLevel(req, res, error) {
    if (error || res.statusCode >= 500) {
      return "error";
    }

    if (res.statusCode >= 400) {
      return "warn";
    }

    return "info";
  },
});
