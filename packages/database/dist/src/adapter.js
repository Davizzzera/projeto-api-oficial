"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaClient = void 0;
exports.createPrismaClient = createPrismaClient;
const pg_1 = __importDefault(require("pg"));
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_js_1 = require("./generated/prisma/client.js");
function createPrismaClient(connectionString) {
    const pool = new pg_1.default.Pool({ connectionString });
    const adapter = new adapter_pg_1.PrismaPg(pool);
    return new client_js_1.PrismaClient({ adapter });
}
var client_js_2 = require("./generated/prisma/client.js");
Object.defineProperty(exports, "PrismaClient", { enumerable: true, get: function () { return client_js_2.PrismaClient; } });
