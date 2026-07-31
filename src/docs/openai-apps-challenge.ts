import type { Env } from '../types/env.js';
import { CspProfile, withSecurityHeaders } from '../utils/html.js';

function readChallengeToken(env: Env): string | null {
  const token = env.OPENAI_APPS_CHALLENGE_TOKEN?.trim();
  if (!token) {
    return null;
  }

  return token;
}

/**
 * Serves OpenAI Apps domain verification at `/.well-known/openai-apps-challenge`.
 *
 * @param _request - Incoming request (path already matched by router)
 * @param env - Worker env; token from secret `OPENAI_APPS_CHALLENGE_TOKEN`
 * @returns Plain-text challenge body, or 404 when unset
 */
export async function handleOpenAiAppsChallenge(
  _request: Request,
  env: Env,
): Promise<Response> {
  const token = readChallengeToken(env);
  if (!token) {
    return withSecurityHeaders(
      new Response('Not Found', { status: 404 }),
      CspProfile.Auth,
    );
  }

  return withSecurityHeaders(
    new Response(token, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    }),
    CspProfile.Auth,
  );
}
