"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeMetadata = sanitizeMetadata;
const DEFAULT_DENYLIST = [
    "password",
    "passwordhash",
    "password_hash",
    "token",
    "tokenhash",
    "token_hash",
    "authorization",
    "cookie",
    "session",
    "secret",
    "appsecret",
    "accesstoken",
    "refreshtoken",
    "databaseurl",
    "redisurl",
];
function sanitizeMetadata(obj, options = {}) {
    const { denylist = DEFAULT_DENYLIST, maxDepth = 5, maxKeys = 100, maxSerializedLength = 10240, // 10kb
     } = options;
    const lowerDenyList = denylist.map((k) => k.toLowerCase());
    const seen = new WeakSet();
    let keyCount = 0;
    function recurse(value, depth) {
        if (depth > maxDepth)
            return "[REDACTED_MAX_DEPTH]";
        if (keyCount > maxKeys)
            return "[REDACTED_MAX_KEYS]";
        if (value === null || value === undefined)
            return value;
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
            return value;
        }
        if (Array.isArray(value)) {
            if (seen.has(value))
                return "[CIRCULAR]";
            seen.add(value);
            const arr = value.map((v) => recurse(v, depth + 1));
            seen.delete(value);
            return arr;
        }
        if (typeof value === "object") {
            if (seen.has(value))
                return "[CIRCULAR]";
            seen.add(value);
            const result = {};
            const keys = Object.keys(value);
            for (const key of keys) {
                keyCount++;
                if (keyCount > maxKeys) {
                    result["__sanitizer_warning"] = "Max keys exceeded";
                    break;
                }
                const lowerKey = key.toLowerCase();
                if (lowerDenyList.includes(lowerKey)) {
                    result[key] = "[REDACTED]";
                }
                else {
                    result[key] = recurse(value[key], depth + 1);
                }
            }
            seen.delete(value);
            return result;
        }
        return `[UNSUPPORTED_TYPE_${typeof value}]`;
    }
    const sanitized = recurse(obj, 0);
    if (typeof sanitized !== "object" || sanitized === null || Array.isArray(sanitized)) {
        return { data: sanitized };
    }
    try {
        const serialized = JSON.stringify(sanitized);
        if (serialized.length > maxSerializedLength) {
            return { __sanitizer_warning: "Max serialized length exceeded" };
        }
    }
    catch (e) {
        return { __sanitizer_warning: "Serialization error" };
    }
    return sanitized;
}
