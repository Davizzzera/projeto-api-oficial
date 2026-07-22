"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const hash_1 = require("../src/hash");
const sanitizer_1 = require("../src/sanitizer");
(0, vitest_1.describe)("Security Hash", () => {
    (0, vitest_1.it)("should hash and verify password", async () => {
        const password = "SuperSecretPassword123!";
        const hash = await (0, hash_1.hashPassword)(password);
        (0, vitest_1.expect)(hash).not.toBe(password);
        const isValid = await (0, hash_1.verifyPassword)(hash, password);
        (0, vitest_1.expect)(isValid).toBe(true);
        const isInvalid = await (0, hash_1.verifyPassword)(hash, "wrongpassword");
        (0, vitest_1.expect)(isInvalid).toBe(false);
    });
    (0, vitest_1.it)("should not need rehash for newly hashed password", async () => {
        const password = "test";
        const hash = await (0, hash_1.hashPassword)(password);
        (0, vitest_1.expect)((0, hash_1.needsRehash)(hash)).toBe(false);
    });
});
(0, vitest_1.describe)("Security Sanitizer", () => {
    (0, vitest_1.it)("should remove sensitive keys", () => {
        const input = {
            user: "test",
            password: "123",
            passwordHash: "hash",
            TOKEN: "abc",
            nested: {
                SeCreT: "hidden",
                safe: "visible"
            }
        };
        const output = (0, sanitizer_1.sanitizeMetadata)(input);
        (0, vitest_1.expect)(output).toEqual({
            user: "test",
            password: "[REDACTED]",
            passwordHash: "[REDACTED]",
            TOKEN: "[REDACTED]",
            nested: {
                SeCreT: "[REDACTED]",
                safe: "visible"
            }
        });
    });
    (0, vitest_1.it)("should handle circular references", () => {
        const input = { a: 1 };
        input.self = input;
        const output = (0, sanitizer_1.sanitizeMetadata)(input);
        (0, vitest_1.expect)(output).toEqual({
            a: 1,
            self: "[CIRCULAR]"
        });
    });
});
