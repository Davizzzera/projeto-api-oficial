"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresHealthIndicator = void 0;
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const database_service_1 = require("../../infrastructure/database/database.service");
let PostgresHealthIndicator = class PostgresHealthIndicator extends terminus_1.HealthIndicator {
    dbService;
    constructor(dbService) {
        super();
        this.dbService = dbService;
    }
    async isHealthy(key) {
        try {
            await this.dbService.$queryRawUnsafe('SELECT 1');
            return this.getStatus(key, true, { message: 'Database connection is stable' });
        }
        catch (error) {
            throw new terminus_1.HealthCheckError('Postgres check failed', this.getStatus(key, false, { message: 'Database connection failed' }));
        }
    }
};
exports.PostgresHealthIndicator = PostgresHealthIndicator;
exports.PostgresHealthIndicator = PostgresHealthIndicator = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], PostgresHealthIndicator);
//# sourceMappingURL=postgres.health.js.map