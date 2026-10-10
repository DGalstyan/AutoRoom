/**
 * Server-side base URL of the AutoRoom API (`API_INTERNAL_URL`).
 *
 * There is deliberately no fallback: a silent `http://localhost:4000` in production would send
 * every page to nowhere and look like "no data". Set it in `apps/web/.env.local` for local
 * development (see `.env.example`) and in the deployment environment (docker-compose.prod.yml).
 */
export function apiBase(): string {
  const value = process.env.API_INTERNAL_URL?.trim();
  if (!value) {
    throw new Error(
      'API_INTERNAL_URL is not set. Set it to the API origin (see apps/web/.env.example).',
    );
  }
  return value.replace(/\/+$/, '');
}
