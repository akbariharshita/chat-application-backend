import { createLogger, format, transports } from "winston";

const { combine, timestamp, printf, colorize } = format;

const fileLogFormat = printf(({ level, message, timestamp, meta }) => {
  const logObject = {
    timestamp,
    level: level.toUpperCase(),
    message,
    meta: meta || undefined,
  };
  return JSON.stringify(logObject);
});

const consoleLogFormat = printf(({ level, message, timestamp, meta }) => {
  return `${timestamp} [${level}] - ${message}${
    meta ? ` Meta: ${JSON.stringify(meta)}` : ""
  }`;
});

export const logger = createLogger({
  level: "info",
  defaultMeta: { service: "user-service" },
  transports: [
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        consoleLogFormat
      ),
    }),
    new transports.File({
      filename: "logs/errors.log",
      level: "error",
      format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        fileLogFormat
      ),
    }),
    new transports.File({
      filename: "logs/combined.log",
      format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        fileLogFormat
      ),
    }),
  ],
});
