export type AppConfig = {
  siteUrl: string;
  issuerUrl: string;
  postLogoutRedirectUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUrl: string;
  sessionSecret: string;
};

function getEnv(name: string, fallback = ""): string {
  return (Bun.env[name] || fallback).trim();
}

export function getConfig(): AppConfig {
  return {
    siteUrl: getEnv("KINDE_SITE_URL", "http://localhost:3000"),
    issuerUrl: getEnv("KINDE_ISSUER_URL"),
    postLogoutRedirectUrl: getEnv("KINDE_POST_LOGOUT_REDIRECT_URL", "http://localhost:3000"),
    clientId: getEnv("KINDE_CLIENT_ID"),
    clientSecret: getEnv("KINDE_CLIENT_SECRET"),
    redirectUrl: getEnv("KINDE_REDIRECT_URL", "http://localhost:3000/kinde_callback"),
    sessionSecret: getEnv("SESSION_SECRET", "replace-this-with-a-long-random-string")
  };
}

export function isConfigured(config: AppConfig): boolean {
  return Boolean(
    config.issuerUrl &&
      config.clientId &&
      config.clientSecret &&
      config.redirectUrl &&
      config.postLogoutRedirectUrl &&
      config.siteUrl
  );
}
