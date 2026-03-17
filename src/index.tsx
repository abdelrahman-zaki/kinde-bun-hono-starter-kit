/** @jsxImportSource hono/jsx */
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { Layout } from './components/layout';
import { createAuthRequest, buildLogoutUrl, exchangeCodeForTokens, userFromPayload, verifyIdToken } from './lib/kinde';
import { getConfig, isConfigured } from './lib/config';
import { clearAuthFlowCookies, clearSession, getAuthFlowCookies, getSession, setAuthFlowCookies, setSession } from './lib/session';

const app = new Hono();
const config = getConfig();

app.use('/assets/*', serveStatic({ root: './public' }));

function IndexPage() {
  return (
    <Layout title="My Kinde App">
      <header>
        <nav class="nav container">
          <h1 class="text-display-3">KindeAuth</h1>
          <div>
            <a class="btn btn-ghost sign-in-btn" href="/login">Sign in</a>
            <a class="btn btn-dark" href="/register">Sign up</a>
          </div>
        </nav>
      </header>
      <main>
        <div class="container">
          <div class="card hero">
            <p class="text-display-1 hero-title">Let's start authenticating</p>
            <p class="text-display-1 hero-title">with KindeAuth</p>
            <p class="text-body-1 hero-tagline">Configure your app</p>
            <a class="btn btn-light btn-big" href="https://kinde.com/docs" target="_blank" rel="noreferrer">Go to docs</a>
          </div>
        </div>
      </main>
    </Layout>
  );
}

function AdminPage(props: { user: { name?: string; given_name?: string; family_name?: string } }) {
  const firstName = props.user.given_name || props.user.name || 'U';
  const initials = `${firstName[0] || ''}${firstName[1] || ''}`;
  const displayName = [props.user.given_name, props.user.family_name].filter(Boolean).join(' ') || props.user.name || 'User';

  return (
    <Layout title="Admin">
      <header>
        <nav class="nav container">
          <h1 class="text-display-3">KindeAuth</h1>
          <div class="profile-blob">
            <div class="avatar">{initials}</div>
            <div>
              <p class="text-heading-2">{displayName}</p>
              <a class="text-subtle" href="/logout">Sign out</a>
            </div>
          </div>
        </nav>
      </header>
      <main>
        <div class="container">
          <div class="card start-hero">
            <p class="text-body-2 start-hero-intro">Woohoo!</p>
            <p class="text-display-2">Your authentication is all sorted.</p>
            <p class="text-display-2">Build the important stuff.</p>
          </div>
          <section class="next-steps-section">
            <h2 class="text-heading-1">Next steps for you</h2>
          </section>
        </div>
      </main>
    </Layout>
  );
}

function MessagePage(props: { title: string; subtitle: string; message: string }) {
  return (
    <Layout title={props.title}>
      <main>
        <div class="container" style="padding-top: 2rem; padding-bottom: 2rem;">
          <div class="card start-hero">
            <p class="text-body-2 start-hero-intro">{props.subtitle}</p>
            <p class="text-display-2">{props.title}</p>
            <p class="text-body-3" style="margin-top: 1rem;">{props.message}</p>
          </div>
        </div>
      </main>
    </Layout>
  );
}

app.get('/', async (c) => {
  if (!isConfigured(config)) {
    return c.html(<MessagePage title="Setup required" subtitle="Setup required" message="Copy .env.example to .env, add your Kinde values, and restart the app." />);
  }

  const session = await getSession(c, config.sessionSecret);

  if (session) {
    return c.redirect('/admin');
  }

  return c.html(<IndexPage />);
});

app.get('/login', async (c) => {
  if (!isConfigured(config)) {
    return c.html(<MessagePage title="Setup required" subtitle="Setup required" message="Copy .env.example to .env, add your Kinde values, and restart the app." />);
  }

  const auth = createAuthRequest('login');
  await setAuthFlowCookies(c, auth.state, auth.nonce, config.sessionSecret);
  return c.redirect(auth.url);
});

app.get('/register', async (c) => {
  if (!isConfigured(config)) {
    return c.html(<MessagePage title="Setup required" subtitle="Setup required" message="Copy .env.example to .env, add your Kinde values, and restart the app." />);
  }

  const auth = createAuthRequest('create');
  await setAuthFlowCookies(c, auth.state, auth.nonce, config.sessionSecret);
  return c.redirect(auth.url);
});

app.get('/kinde_callback', async (c) => {
  if (!isConfigured(config)) {
    return c.html(<MessagePage title="Setup required" subtitle="Setup required" message="Copy .env.example to .env, add your Kinde values, and restart the app." />);
  }

  const code = c.req.query('code');
  const returnedState = c.req.query('state');
  const error = c.req.query('error');
  const errorDescription = c.req.query('error_description');

  if (error) {
    return c.html(<MessagePage title="Authentication error" subtitle="Authentication error" message={errorDescription || error} />);
  }

  if (!code || !returnedState) {
    return c.text('Missing code or state.', 400);
  }

  const { state } = await getAuthFlowCookies(c, config.sessionSecret);

  if (!state || state !== returnedState) {
    return c.text('State validation failed.', 400);
  }

  const tokens = await exchangeCodeForTokens(code);
  const payload = await verifyIdToken(tokens.id_token);
  const user = userFromPayload(payload as Record<string, unknown>);

  await setSession(
    c,
    {
      accessToken: tokens.access_token,
      idToken: tokens.id_token,
      refreshToken: tokens.refresh_token,
      user
    },
    config.sessionSecret
  );

  clearAuthFlowCookies(c);
  return c.redirect('/admin');
});

app.get('/admin', async (c) => {
  if (!isConfigured(config)) {
    return c.html(<MessagePage title="Setup required" subtitle="Setup required" message="Copy .env.example to .env, add your Kinde values, and restart the app." />);
  }

  const session = await getSession(c, config.sessionSecret);

  if (!session) {
    return c.redirect('/');
  }

  return c.html(<AdminPage user={session.user} />);
});

app.get('/logout', async (c) => {
  if (!isConfigured(config)) {
    return c.redirect('/');
  }

  clearAuthFlowCookies(c);
  clearSession(c);
  return c.redirect(buildLogoutUrl());
});

export default {
  fetch: app.fetch
};
