import 'server-only';

export function getInternalApiUrl(): string {
  const configuredUrl = process.env.INTERNAL_API_URL?.trim();

  if (configuredUrl) {
    const url = new URL(configuredUrl);
    return url.origin;
  }

  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    return "http://localhost:3333";
  }

  throw new Error("INTERNAL_API_URL is required");
}
