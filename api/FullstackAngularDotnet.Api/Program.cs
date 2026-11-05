using System.Reflection;

const string appName = "app-service-builder-angular-dotnet-api";

var builder = WebApplication.CreateBuilder(args);
var configuredPort = ResolvePort(Environment.GetEnvironmentVariable("PORT"));

if (configuredPort is not null)
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{configuredPort}");
}

var app = builder.Build();

app.MapGet("/api/health", () => Results.Ok(new
{
    status = "ok",
    app = appName,
    deploymentMarker = Environment.GetEnvironmentVariable("DEPLOYMENT_MARKER") ?? "local"
}));

app.MapGet("/api/status", () => Results.Ok(new
{
    status = "available",
    app = appName,
    timestamp = DateTimeOffset.UtcNow
}));

app.MapGet("/api/version", () => Results.Ok(new
{
    app = appName,
    version = Assembly.GetExecutingAssembly().GetName().Version?.ToString(3) ?? "1.0.0",
    framework = "ASP.NET Core",
    runtime = Environment.Version.ToString(),
    deploymentMarker = Environment.GetEnvironmentVariable("DEPLOYMENT_MARKER") ?? "local"
}));

app.MapGet("/api/request", (HttpRequest request) => Results.Ok(new
{
    method = request.Method,
    path = request.Path.Value,
    headers = new
    {
        host = request.Headers.Host.FirstOrDefault(),
        userAgent = request.Headers.UserAgent.FirstOrDefault(),
        forwardedProto = request.Headers["X-Forwarded-Proto"].FirstOrDefault()
    }
}));

app.MapPost("/api/echo", (EchoRequest request) => Results.Ok(new
{
    message = request.Message,
    received = true
}));

app.MapFallback((HttpRequest request) =>
{
    if (request.Path.StartsWithSegments("/api"))
    {
        return Results.Json(
            new
            {
                error = "not_found",
                message = "The requested API route does not exist."
            },
            statusCode: StatusCodes.Status404NotFound);
    }

    return Results.Json(
        new
        {
            error = "not_found",
            message = "This component only serves routes beneath /api."
        },
        statusCode: StatusCodes.Status404NotFound);
});

app.Run();

static int? ResolvePort(string? rawPort)
{
    if (string.IsNullOrWhiteSpace(rawPort))
    {
        return null;
    }

    if (!int.TryParse(rawPort, out var port) || port is < 1 or > 65535)
    {
        throw new InvalidOperationException(
            $"PORT must be an integer between 1 and 65535; received \"{rawPort}\".");
    }

    return port;
}

public sealed record EchoRequest(string Message);

public partial class Program;
