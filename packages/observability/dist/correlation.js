"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureCorrelationId = void 0;
const uuid_1 = require("uuid");
const ensureCorrelationId = (id) => {
    const strId = Array.isArray(id) ? id[0] : id;
    if (strId && (0, uuid_1.validate)(strId)) {
        return strId;
    }
    return (0, uuid_1.v4)();
};
exports.ensureCorrelationId = ensureCorrelationId;
