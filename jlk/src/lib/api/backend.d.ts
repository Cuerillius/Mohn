// Type stub for CloudflareBindings - needed so the frontend TypeScript
// can resolve the AppType imported from the backend without pulling in
// the full Cloudflare Workers type definitions.

interface CloudflareBindings {
  FRONTEND_URL: string;
  DATABASE_URL: string;
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  TMDB_API_TOKEN: string;
}
