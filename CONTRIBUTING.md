# Contributing to App Service Builder: Angular + ASP.NET Core sample

This project welcomes contributions and suggestions.

## Contributor License Agreement

Most contributions require a Contributor License Agreement (CLA) declaring
that you have the right to grant us the rights to use your contribution.
See [Microsoft Contributor License Agreements](https://cla.opensource.microsoft.com/).
Follow any CLA instructions shown on your pull request.

## Code of Conduct

This project follows the
[Microsoft Open Source Code of Conduct](.github/CODE_OF_CONDUCT.md).

## Issues and feature requests

Search [existing issues](https://github.com/AzureAppService/app-service-builder-angular-dotnet/issues)
before opening a new one. Include reproduction steps, expected and actual
behavior, .NET SDK/Node.js/npm versions, operating system, browser, and sanitized logs.
For larger changes, open an issue to discuss the proposal first.

Do not include credentials or private environment values. For security concerns,
follow [the security policy](SECURITY.md) instead of opening a public issue.

## Development and pull requests

1. Fork the repository and create a branch for your change.
2. Install frontend dependencies and restore the .NET solution as described
   in [the README](README.md).
3. Keep the sample standalone, small, and free of external service dependencies.
4. Update tests and documentation when behavior changes.
5. Run the API tests, production Angular build, .NET publish, and three integration
   checks from the README. Describe the changes and results in your pull request.

For UI or routing changes, also verify the API status button, direct frontend
deep links, refreshes, JSON echo, API 404 responses, and the API-unavailable
error state. Preserve the internal project/assembly names, component roots,
Angular build/copy output, and `/api` prefix unless intentionally changing and
validating the deployment contract. Local proxy behavior does not replace
deployed route verification.

Do not commit installed dependencies, build output, environment files, or secrets.
The preview helper is for local verification only, not production hosting.
