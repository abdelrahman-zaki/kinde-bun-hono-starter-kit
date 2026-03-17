/** @jsxImportSource hono/jsx */

export function Layout(props: { title?: string; children: any }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" type="text/css" href="./assets/style.css" />
        <title>{props.title || 'My Kinde App'}</title>
      </head>
      <body>
        {props.children}
        <footer class="footer">
          <div class="container">
            <strong class="text-heading-2">KindeAuth</strong>
            <p class="footer-tagline text-body-3">
              Visit our <a class="link" href="https://kinde.com/docs">help center</a>
            </p>
            <small class="text-subtle">© 2022 KindeAuth, Inc. All rights reserved</small>
          </div>
        </footer>
      </body>
    </html>
  );
}
