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
exports.SecurityEventRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../../infrastructure/database/database.service");
let SecurityEventRepository = class SecurityEventRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async create(data) {
        return this.db.getClient().securityEvent.create({
            data: {
                eventType: data.eventType,
                severity: data.severity,
                ipAddressMasked: data.ipAddressMasked,
                ipAddressHash: data.ipAddressHash,
                userAgent: data.userAgent,
                ...(data.userId && { user: { connect: { id: data.userId } } }),
                ...(data.organizationId && { organization: { connect: { id: data.organizationId } } }),
                metadata: data.metadata,
            },
        });
    }
    async findManyByOrganization(organizationId, options) {
        const { skip = 0, take = 50 } = options || {};
        return this.db.getClient().securityEvent.findMany({
            where: { organizationId },
            skip,
            take,
            orderBy: { occurredAt: 'desc' },
        });
    }
    async findManyByUser(userId, options) {
        const { skip = 0, take = 50 } = options || {};
        return this.db.getClient().securityEvent.findMany({
            where: { userId },
            skip,
            take,
            orderBy: { occurredAt: 'desc' },
        });
    }
};
exports.SecurityEventRepository = SecurityEventRepository;
exports.SecurityEventRepository = SecurityEventRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], SecurityEventRepository);
//# sourceMappingURL=security-event.repository.js.map