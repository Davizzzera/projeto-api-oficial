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
exports.OrganizationRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../../infrastructure/database/database.service");
let OrganizationRepository = class OrganizationRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async findById(id) {
        return this.db.getClient().organization.findFirst({
            where: {
                id,
                deletedAt: null,
            },
        });
    }
    async findBySlug(slug) {
        return this.db.getClient().organization.findFirst({
            where: {
                slug,
                deletedAt: null,
            },
        });
    }
    async create(data) {
        return this.db.getClient().organization.create({
            data,
        });
    }
};
exports.OrganizationRepository = OrganizationRepository;
exports.OrganizationRepository = OrganizationRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], OrganizationRepository);
//# sourceMappingURL=organization.repository.js.map