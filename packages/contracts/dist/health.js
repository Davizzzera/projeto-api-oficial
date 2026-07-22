"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadinessStatusSchema = exports.HealthStatusSchema = void 0;
const zod_1 = require("zod");
exports.HealthStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['up', 'down', 'degraded']),
    timestamp: zod_1.z.string().datetime(),
    version: zod_1.z.string().optional(),
});
exports.ReadinessStatusSchema = exports.HealthStatusSchema.extend({
    services: zod_1.z.record(zod_1.z.string(), zod_1.z.object({
        status: zod_1.z.enum(['up', 'down']),
        message: zod_1.z.string().optional(),
    })),
});
