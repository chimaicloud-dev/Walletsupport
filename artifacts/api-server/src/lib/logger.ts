import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

// In production (serverless), use synchronous stdout writing — no worker threads.
// In development, use pino-pretty for readable logs.
export const logger = isProduction
  ? pino({ level: process.env.LOG_LEVEL ?? "info" })
  : pino({
      level: process.env.LOG_LEVEL ?? "info",
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    });
