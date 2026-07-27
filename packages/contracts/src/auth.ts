import { z } from "zod";

export const AuthCsrfActionSchema = z.enum([
  "auth:logout",
  "auth:switch-organization"
]);

export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const SwitchOrganizationInputSchema = z.object({
  organizationId: z.string().uuid()
});

export const AuthCsrfResponseSchema = z.object({
  csrfToken: z.string()
});

export const AuthMeResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email()
  }),
  organization: z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string()
  }),
  membership: z.object({
    id: z.string().uuid(),
    roleCode: z.string()
  })
});

export const AuthOrganizationItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  roleCode: z.string(),
  isCurrent: z.boolean()
});

export const AuthOrganizationsResponseSchema = z.array(AuthOrganizationItemSchema);

export type AuthCsrfAction = z.infer<typeof AuthCsrfActionSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type SwitchOrganizationInput = z.infer<typeof SwitchOrganizationInputSchema>;
export type AuthCsrfResponse = z.infer<typeof AuthCsrfResponseSchema>;
export type AuthMeResponse = z.infer<typeof AuthMeResponseSchema>;
export type AuthOrganizationItem = z.infer<typeof AuthOrganizationItemSchema>;
export type AuthOrganizationsResponse = z.infer<typeof AuthOrganizationsResponseSchema>;
