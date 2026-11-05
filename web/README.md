# Angular frontend

This is the static Angular 21 component of the
[App Service Builder Angular + ASP.NET Core sample](../README.md).

From the repository root:

```sh
npm --prefix web ci
npm --prefix web start -- --host 127.0.0.1 --port 18092 --proxy-config proxy.conf.json
```

Start the API separately as described in the root guide. The local development
proxy forwards `/api` to `http://127.0.0.1:18093` without stripping the prefix.
The browser always calls relative `/api` URLs.

Build and preview the actual production frontend:

```sh
npm --prefix web run build
node scripts/preview.mjs
```

The Angular project name remains `web`, and its browser output is
`web/dist/web/browser/`. The deployed static host must support SPA fallback
without intercepting the separate `/api` component. Preserve the manifest's
install/build/copy command. See the root guide for tests and deployment.
