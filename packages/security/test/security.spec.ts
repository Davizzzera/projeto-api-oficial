import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, needsRehash } from "../src/hash";
import { sanitizeMetadata } from "../src/sanitizer";

describe("Security Hash", () => {
  it("should hash and verify password", async () => {
    const password = "SuperSecretPassword123!";
    const hash = await hashPassword(password);
    
    expect(hash).not.toBe(password);
    
    const isValid = await verifyPassword(hash, password);
    expect(isValid).toBe(true);
    
    const isInvalid = await verifyPassword(hash, "wrongpassword");
    expect(isInvalid).toBe(false);
  });

  it("should not need rehash for newly hashed password", async () => {
    const password = "test";
    const hash = await hashPassword(password);
    expect(needsRehash(hash)).toBe(false);
  });
});

describe("Security Sanitizer", () => {
  it("should remove sensitive keys", () => {
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

    const output = sanitizeMetadata(input);

    expect(output).toEqual({
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

  it("should handle circular references", () => {
    const input: any = { a: 1 };
    input.self = input;
    
    const output = sanitizeMetadata(input);
    expect(output).toEqual({
      a: 1,
      self: "[CIRCULAR]"
    });
  });
});
