# App Service Builder: Angular + ASP.NET Core sample

The useful frontend is at `/`. **Check API health** shows the `/api/health`
response in the page, with failure and retry feedback, instead of opening a raw
endpoint. Process readiness does not verify Azure deployment.
Expand **Customize this sample** for the frontend and API source paths to edit
in your own fork. Links distinguish App Service Builder documentation from
Angular documentation; the page does not edit GitHub or guess your app URL.

A standalone Angular frontend and ASP.NET Core API deployed as two components
behind one public hostname with
[Azure App Service Builder](https://builderapps.azure.com/docs/). Angular builds
into static files; the .NET API runs separately. The browser calls relative
`/api` URLs, so no CORS configuration, database, external service, or parent
workspace is required.

**App Service Builder is in Private Preview. Use this sample for development
and testing, not as a production application template.** The original sample
was successfully deployed with the included manifest, and backend status was
verified through its frontend. The renamed repository must still be deployed
and verified in your authorized preview environment. Local checks do not
establish cloud deployment success or regional availability.

## Features and structure

- Angular Router landing, product, and client-side not-found pages.
- An on-demand status card that calls the real ASP.NET Core API.
- JSON health, status, identity, selected request metadata, and echo routes.
- API tests and integration checks of the built frontend and published backend.

```text
api/FullstackAngularDotnet.Api/        ASP.NET Core application
tests/FullstackAngularDotnet.Api.Tests/ API tests
web/                                 Angular frontend and npm lockfile
FullstackAngularDotnet.slnx           .NET solution
builder.yaml                         Two-component deployment configuration
fullstack.test.mjs                    Standalone integration checks
scripts/preview.mjs                   Local built-frontend preview and API proxy
scripts/verify.ps1                    Local or deployed HTTP verification
```

The internal .NET project/assembly names and Angular project name `web` are
intentionally unchanged. Each component owns its dependencies. There is no
root `package.json`; run the commands below from the repository root.

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0).
- [Node.js 24 LTS](https://nodejs.org/) **24.15.0 or newer** and its bundled npm are recommended.
- [Git](https://git-scm.com/) and a GitHub account.
- For deployment: App Service Builder Private Preview access, an authorized
  Azure subscription, and an existing resource group in a supported preview location.
- Optional: [PowerShell 7](https://learn.microsoft.com/powershell/scripting/install/installing-powershell)
  for the endpoint verification script.

The frontend lockfile contains Angular **22.2.4**, Angular CLI/build **22.2.5**,
and TypeScript **6.0.3**. Angular 22.2 requires TypeScript `>=6.0 <6.1`;
keep TypeScript on `~6.0.3` rather than bypassing peer-dependency checks.
The API targets `net10.0`; its Builder runtime pin is **10.0.12**.
Keep the lockfile and existing .NET package versions during setup.

## Run locally

Fork
[AzureAppService/app-service-builder-angular-dotnet](https://github.com/AzureAppService/app-service-builder-angular-dotnet/fork)
to your GitHub account. Clone your fork, replacing `<your-github-account>`:

```sh
git clone https://github.com/<your-github-account>/app-service-builder-angular-dotnet.git
cd app-service-builder-angular-dotnet
npm --prefix web ci
dotnet restore FullstackAngularDotnet.slnx
```

### Start the API

In PowerShell:

```powershell
$env:PORT = "18093"
dotnet run --project .\api\FullstackAngularDotnet.Api --no-launch-profile
```

On Linux or macOS:

```sh
PORT=18093 dotnet run --project api/FullstackAngularDotnet.Api --no-launch-profile
```

When `PORT` is set, the API binds to `0.0.0.0` on that port. Use it only on a
trusted development network. `PORT` must be an integer from 1 to 65535.
Without `PORT`, standard ASP.NET Core URL configuration applies; do not assume
the API defaults to `8080`. The included manifest supplies component port `8080`.
`--no-launch-profile` avoids the scaffold's development URL and browser launch.

### Start the frontend

In a second terminal:

```sh
npm --prefix web start -- --host 127.0.0.1 --port 18092 --proxy-config proxy.conf.json
```

Open `http://localhost:18092/`. Expect the heading
`Angular and ASP.NET Core full-stack app`. Select **Check API status**;
the status card should show `available` and application
`app-service-builder-angular-dotnet-api`.

Angular's development proxy forwards `/api` to `http://127.0.0.1:18093`
without removing the prefix. Keep the API running. If it is unavailable,
selecting the button should display `The frontend could not reach the API.`
Stop each process with Ctrl+C. If you change the API port, update the local
target in `web/proxy.conf.json`; it is not deployed routing configuration.

## Test, build, and publish

From the repository root:

```sh
dotnet test FullstackAngularDotnet.slnx --configuration Release --no-restore
npm --prefix web run build
dotnet publish api/FullstackAngularDotnet.Api/FullstackAngularDotnet.Api.csproj --configuration Release --no-restore
node --test fullstack.test.mjs
```

The API tests cover health, identity, JSON echo, filtered request metadata,
and missing API routes. The three integration checks verify the manifest,
static output, frontend deep links, generated assets, JSON endpoints, echo,
and API 404 responses through one local origin.

Integration checks start the published .NET API and a static preview on
available loopback ports, then stop both. They do not require your manually
started servers. Restore dependencies, build Angular, and publish the API
before running them. GitHub Actions performs these checks on Linux and Windows.
This sample has no Angular unit-test target configured; `npm test` is not part
of these checks.

### Preview the actual production frontend

Keep the API running on port `18093`, then run:

```sh
node scripts/preview.mjs
```

Open `http://127.0.0.1:8080/`. This dependency-free, loopback-only helper serves
the actual `web/dist/web/browser/` files, supports SPA fallback, and proxies
`/api` to the API. It is a local verification tool, **not a production server
or a component to deploy**. Rebuild and restart it after frontend changes.

`API_PROXY_TARGET` can override this helper's backend target, for example
`http://127.0.0.1:18094`. It affects this preview only, not Angular's development
proxy or Builder. In PowerShell, set it in the preview terminal:

```powershell
$env:API_PROXY_TARGET = "http://127.0.0.1:18094"
node .\scripts\preview.mjs
```

With the API and frontend running, optionally use PowerShell 7:

```powershell
pwsh -NoProfile -File .\scripts\verify.ps1 -BaseUrl http://127.0.0.1:8080
```

The script checks HTTP responses and an echo request; it does not execute
Angular. In a browser, also verify the status button, in-app navigation,
direct navigation to `/products/widget-1`, refreshing that route, and the
unknown route's `Page not found` heading.

## Routes and prefix ownership

| Route | Expected behavior |
|---|---|
| `/` | HTTP 200 shell; Angular renders the landing page and status button |
| `/products/widget-1` | HTTP 200 shell; Angular renders `Widget 1` |
| `/unknown-client-route` | HTTP 200 shell; Angular renders `Page not found` |
| `/version.json` | HTTP 200, static frontend identity JSON |
| `GET /api/health` | HTTP 200, API health and identity JSON |
| `GET /api/status` | HTTP 200, availability, application name, and timestamp |
| `GET /api/version` | HTTP 200, API/framework/runtime identity and public marker |
| `GET /api/request` | HTTP 200, selected request metadata |
| `POST /api/echo` | HTTP 200, `{ "message": "hello", "received": true }` for a JSON message |
| `/api/missing` | HTTP 404, JSON API error rather than the SPA shell |

The static host must return the SPA entry point for frontend deep links;
unknown client routes render a not-found page with HTTP status 200.
The `/api` prefix must take precedence over SPA fallback. Verify both after deployment.

API routes are public and unauthenticated. Do not send credentials or private
data to the echo endpoint. `/api/request` returns only host, user-agent, and
forwarded-protocol headers, not authorization or cookie headers.

## Deployment contract

The root `builder.yaml` preserves this two-component configuration:

```yaml
components:
  - name: web
    rootDirectory: web
    role: static
    platform: nodejs
    build: >-
      npm ci
      && npm run build
      && mkdir -p "$DESTINATION_DIR/dist/web/browser"
      && cp -r dist/web/browser/. "$DESTINATION_DIR/dist/web/browser/"
    output: dist/web/browser
    path: /

  - name: api
    rootDirectory: api/FullstackAngularDotnet.Api
    role: web
    platform: dotnet
    platformVersion: "10.0.12"
    path: /api
    run:
      port: 8080
      start: dotnet FullstackAngularDotnet.Api.dll
      healthCheckPath: /api/health
```

The custom frontend build must install dependencies, build Angular, and copy
its browser artifacts beneath `$DESTINATION_DIR`. Do not remove the copy step,
change the Angular project/output name, or serve source files as static output.
The backend is separately built and published for .NET 10 and starts its
existing assembly. No frontend development server runs in the deployment.
Keep the full `/api` prefix in backend routes; local proxies are not deployment rewrites.

## Deploy your fork through Builder Portal

Follow the [Portal quickstart](https://builderapps.azure.com/docs/quickstarts/portal/)
for your authorized Private Preview environment:

1. Commit and push the sample to your GitHub repository's `main` branch.
2. Select your enabled subscription, existing resource group, and supported preview location.
3. Connect GitHub and authorize the Builder GitHub app for the repository.
   Obtain organization-owner approval if required.
4. Create an app using branch `main` and the repository root as its source directory.
   Keep both component folders and `builder.yaml`.
5. Explicitly deploy and wait for a successful terminal status. Connecting source
   or pushing a commit is not proof of deployment.
6. Open the returned URL and select **Check API status**. Verify frontend and API
   identity endpoints, direct product links, refreshes, and API 404 JSON.

### Public marker and updates

The optional `DEPLOYMENT_MARKER` variable is read by the running API and returned
by `/api/health` and `/api/version`. It defaults to `local` and is intentionally
public. **Never put credentials, connection strings, or private information in it.**
Configure it for the API through Portal **Variables**, then deploy to apply it.
See the [variables guide](https://builderapps.azure.com/docs/guides/variables/).
The frontend's static version JSON does not read runtime variables.

For code changes, run the checks, commit, and push to your fork's `main` branch.
Explicitly deploy through Builder Portal and verify both components together.
Automatic deployment on push is not qualified by this sample.

### Cleanup

Delete only the Builder app you created and wait for deletion to complete.
Do not delete a shared resource group, subscription, or unrelated resources.
Deleting the app does not delete your GitHub repository or local clone.

## Resources and contributions

- [App Service Builder documentation](https://builderapps.azure.com/docs/)
- [Sample catalog](https://builderapps.azure.com/docs/samples/)
- [Manifest guide](https://builderapps.azure.com/docs/guides/builder-yaml/)
- [Contributing](CONTRIBUTING.md)
- [Code of Conduct](.github/CODE_OF_CONDUCT.md)
- [Security reporting](SECURITY.md)
- [Changelog](CHANGELOG.md)
- [MIT license](LICENSE.md)
