"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProblemDetailsSchema = void 0;
const zod_1 = require("zod");
exports.ProblemDetailsSchema = zod_1.z.object({
    type: zod_1.z.string().url().optional(),
    title: zod_1.z.string(),
    status: zod_1.z.number().int(),
    detail: zod_1.z.string().optional(),
    instance: zod_1.z.string().optional(),
    correlationId: zod_1.z.string().optional(),
    errors: zod_1.z.array(zod_1.z.object({
        code: zod_1.z.string(),
        message: zod_1.z.string(),
        path: zod_1.z.array(zod_1.z.string()).optional()
    })).optional()
});
