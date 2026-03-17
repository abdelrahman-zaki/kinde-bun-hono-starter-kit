import type { Context } from 'hono';
import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie';

export type SessionUser = {
  sub?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  picture?: string;
};

export type SessionData = {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  user: SessionUser;
};

const SESSION_COOKIE = 'kinde_session';
const STATE_COOKIE = 'kinde_auth_state';
const NONCE_COOKIE = 'kinde_auth_nonce';

function isSecureRequest(c: Context) {
  const url = new URL(c.req.url);
  return url.protocol === 'https:';
}

export async function setAuthFlowCookies(c: Context, state: string, nonce: string, secret: string) {
  await setSignedCookie(c, STATE_COOKIE, state, secret, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    secure: isSecureRequest(c),
    maxAge: 60 * 10
  });

  await setSignedCookie(c, NONCE_COOKIE, nonce, secret, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    secure: isSecureRequest(c),
    maxAge: 60 * 10
  });
}

export async function getAuthFlowCookies(c: Context, secret: string) {
  const state = await getSignedCookie(c, secret, STATE_COOKIE);
  const nonce = await getSignedCookie(c, secret, NONCE_COOKIE);
  return { state, nonce };
}

export function clearAuthFlowCookies(c: Context) {
  deleteCookie(c, STATE_COOKIE, { path: '/' });
  deleteCookie(c, NONCE_COOKIE, { path: '/' });
}

export async function setSession(c: Context, session: SessionData, secret: string) {
  await setSignedCookie(c, SESSION_COOKIE, JSON.stringify(session), secret, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    secure: isSecureRequest(c),
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function getSession(c: Context, secret: string): Promise<SessionData | null> {
  const raw = await getSignedCookie(c, secret, SESSION_COOKIE);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

export function clearSession(c: Context) {
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
}
