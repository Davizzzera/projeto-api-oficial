export declare const PlatformRole: {
    readonly SUPER_ADMIN: "SUPER_ADMIN";
};
export type PlatformRole = (typeof PlatformRole)[keyof typeof PlatformRole];
export declare const UserStatus: {
    readonly PENDING_VERIFICATION: "PENDING_VERIFICATION";
    readonly ACTIVE: "ACTIVE";
    readonly INACTIVE: "INACTIVE";
    readonly SUSPENDED: "SUSPENDED";
};
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
export declare const OrganizationStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly INACTIVE: "INACTIVE";
    readonly SUSPENDED: "SUSPENDED";
};
export type OrganizationStatus = (typeof OrganizationStatus)[keyof typeof OrganizationStatus];
export declare const MembershipStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly INACTIVE: "INACTIVE";
    readonly SUSPENDED: "SUSPENDED";
};
export type MembershipStatus = (typeof MembershipStatus)[keyof typeof MembershipStatus];
export declare const ThemePreference: {
    readonly LIGHT: "LIGHT";
    readonly DARK: "DARK";
    readonly SYSTEM: "SYSTEM";
};
export type ThemePreference = (typeof ThemePreference)[keyof typeof ThemePreference];
export declare const SecurityEventSeverity: {
    readonly INFO: "INFO";
    readonly WARNING: "WARNING";
    readonly CRITICAL: "CRITICAL";
};
export type SecurityEventSeverity = (typeof SecurityEventSeverity)[keyof typeof SecurityEventSeverity];
