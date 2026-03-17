import { createRemoteJWKSet, jwtVerify } from 'jose';
import { getConfig } from './config';
import type { SessionUser } from './session';

const scopes = ['openid', 'profile', 'email', 'offline'].join(' ');

function cleanIssuer(issuer: string) {
  return issuer.replace(/\/$/, '');
}

function randomString(length = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function createAuthRequest(prompt: 'login' | 'create') {
  const config = getConfig();
  const state = randomString(16);
  const nonce = randomString(16);
  const issuer = cleanIssuer(config.issuerUrl);

  const url = new URL(`${issuer}/oauth2/auth`);
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', config.redirectUrl);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scopes);
  url.searchParams.set('state', state);
  url.searchParams.set('nonce', nonce);
  url.searchParams.set('prompt', prompt);

  return {
    state,
    nonce,
    url: url.toString()
  };
}

export function buildLogoutUrl() {
  const config = getConfig();
  const issuer = cleanIssuer(config.issuerUrl);
  const url = new URL(`${issuer}/logout`);
  url.searchParams.set('redirect', config.postLogoutRedirectUrl);
  return url.toString();
}

export async function exchangeCodeForTokens(code: string) {
  const config = getConfig();
  const issuer = cleanIssuer(config.issuerUrl);

  const response = await fetch(`${issuer}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUrl,
      code
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Token exchange failed: ${body}`);
  }

  return (await response.json()) as {
    access_token: string;
    id_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
  };
}

export async function verifyIdToken(idToken: string) {
  const config = getConfig();
  const issuer = cleanIssuer(config.issuerUrl);
  const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks`));

  const { payload } = await jwtVerify(idToken, jwks, {
    issuer,
    audience: config.clientId
  });

  return payload;
}

export function userFromPayload(payload: Record<string, unknown>): SessionUser {
  const givenName = typeof payload.given_name === 'string' ? payload.given_name : undefined;
  const familyName = typeof payload.family_name === 'string' ? payload.family_name : undefined;
  const fullName = [givenName, familyName].filter(Boolean).join(' ').trim();

  return {
    sub: typeof payload.sub === 'string' ? payload.sub : undefined,
    given_name: givenName,
    family_name: familyName,
    name:
      typeof payload.name === 'string'
        ? payload.name
        : fullName || undefined,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    picture: typeof payload.picture === 'string' ? payload.picture : undefined
  };
}
