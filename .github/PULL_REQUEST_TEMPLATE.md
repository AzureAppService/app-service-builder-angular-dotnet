## Purpose

Describe the change and link any related issue.

## Type of change

- [ ] Bug fix
- [ ] Feature
- [ ] Documentation
- [ ] Tests or maintenance

## Validation

- [ ] `npm --prefix web ci`
- [ ] `dotnet restore FullstackAngularDotnet.slnx`
- [ ] `dotnet test FullstackAngularDotnet.slnx --configuration Release --no-restore`
- [ ] `npm --prefix web run build`
- [ ] `dotnet publish api/FullstackAngularDotnet.Api/FullstackAngularDotnet.Api.csproj --configuration Release --no-restore`
- [ ] `node --test fullstack.test.mjs`
- [ ] Relevant documentation and tests updated
- [ ] No secrets, environment files, installed dependencies, or build output included

For UI or routing changes, describe browser checks of real API status,
frontend deep links and refreshes, and API JSON responses.
Distinguish local proxy checks from live Builder deployment results.

## Breaking changes

Describe any changed routes, environment variables, or deployment behavior.
