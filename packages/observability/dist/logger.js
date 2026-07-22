"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = exports.loggerConfig = void 0;
const pino_1 = require("pino");
exports.loggerConfig = {
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
const createLogger = (name, level = 'info') => {
    return (0, pino_1.pino)({
        name,
        level,
        redact: exports.loggerConfig.redact,
    });
};
exports.createLogger = createLogger;
