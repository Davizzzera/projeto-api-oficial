export interface SanitizeOptions {
    denylist?: string[];
    maxDepth?: number;
    maxKeys?: number;
    maxSerializedLength?: number;
}
export declare function sanitizeMetadata(obj: unknown, options?: SanitizeOptions): Record<string, unknown> | null;
