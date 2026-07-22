import { pino } from 'pino';

export const loggerConfig = {
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      'password',
      'password_hash',
      'session',
      'access_token',
      'app_secret',
      'DATABASE_URL',
      'REDIS_URL',
    ],
    remove: true,
  },
};

export const createLogger = (name: string, level: string = 'info') => {
  return pino({
    name,
    level,
    redact: loggerConfig.redact,
  });
};
