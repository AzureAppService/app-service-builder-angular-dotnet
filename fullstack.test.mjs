import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { readdir, readFile } from 'node:fs/promises'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { stripVTControlCharacters } from 'node:util'
import { createPreviewServer } from './scripts/preview.mjs'

test('manifest preserves explicit Angular output and separate API routing', async () => {
  const manifest = await readFile(new URL('./builder.yaml', import.meta.url), 'utf8')
  assert.equal(manifest.replaceAll('\r\n', '\n').trimEnd(), `components:
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
      healthCheckPath: /api/health`)
})

test('frontend build contains static assets and public identity', async () => {
  const root = new URL('./web/dist/web/browser/', import.meta.url)
  const entries = await readdir(root)
  assert.ok(entries.includes('index.html'))
  assert.ok(entries.includes('favicon.ico'))
  assert.ok(entries.some((name) => name.endsWith('.js')))
  assert.ok(entries.some((name) => name.endsWith('.css')))
  assert.ok(entries.every((name) => name === 'brand' || /\.(html|js|css|json|ico)$/.test(name)))
  assert.deepEqual(JSON.parse(await readFile(new URL('version.json', root), 'utf8')), {
    app: 'app-service-builder-angular-dotnet-web',
    version: '1.0.0',
  })
})

test('built Angular frontend and published API share one origin', { timeout: 30000 }, async (t) => {
  const env = {
    ...process.env,
    ASPNETCORE_URLS: 'http://127.0.0.1:0',
    ASPNETCORE_ENVIRONMENT: 'Production',
  }
  delete env.PORT
  const published = new URL('./api/FullstackAngularDotnet.Api/bin/Release/net10.0/publish/', import.meta.url)
  const api = spawn('dotnet', [
    fileURLToPath(new URL('FullstackAngularDotnet.Api.dll', published)),
  ], {
    cwd: published,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const closed = new Promise((resolve) => api.once('close', resolve))
  t.after(async () => {
    if (api.exitCode === null && api.signalCode === null) api.kill('SIGTERM')
    await closed
  })
  const apiOrigin = await new Promise((resolve, reject) => {
    let output = ''
    const timeout = setTimeout(() => reject(new Error(`API did not become ready: ${output}`)), 10000)
    const finish = (error, origin) => {
      clearTimeout(timeout)
      if (error) reject(error)
      else resolve(origin)
    }
    const receive = (chunk) => {
      output += chunk.toString()
      const origin = stripVTControlCharacters(output).match(/http:\/\/127\.0\.0\.1:\d+(?=\s)/)?.[0]
      if (origin) finish(null, origin)
    }
    api.once('error', (error) => finish(error))
    api.once('close', (code) => finish(new Error(`API exited (${code}): ${output}`)))
    api.stdout.on('data', receive)
    api.stderr.on('data', receive)
  })

  const preview = await createPreviewServer(apiOrigin)
  await new Promise((resolve, reject) => {
    preview.once('error', reject)
    preview.listen(0, '127.0.0.1', resolve)
  })
  t.after(() => new Promise((resolve, reject) => {
    preview.close((error) => error ? reject(error) : resolve())
  }))
  const address = preview.address()
  assert.ok(address && typeof address !== 'string')
  const origin = `http://127.0.0.1:${address.port}`

  const root = await fetch(origin)
  assert.equal(root.status, 200)
  assert.match(root.headers.get('content-type'), /text\/html/)
  const html = await root.text()
  assert.ok(html.includes('<title>App Service Builder: Angular + ASP.NET Core sample</title>'))
  assert.match(html, /<app-root><\/app-root>/)
  assert.doesNotMatch(html, /\/src\/|node_modules/)
  for (const route of ['/products/widget-1', '/unknown-client-route']) {
    const response = await fetch(new URL(route, origin))
    assert.equal(response.status, 200)
    assert.equal(await response.text(), html)
  }
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map((match) => match[1])
  const styles = [...html.matchAll(/<link\b[^>]*\bhref="([^"]+\.css)"/g)].map((match) => match[1])
  assert.ok(scripts.length > 0)
  assert.ok(styles.length > 0)
  for (const [asset, contentType] of [
    ...scripts.map((asset) => [asset, /javascript/]),
    ...styles.map((asset) => [asset, /text\/css/]),
    ['/brand/builder.svg', /image\/svg\+xml/],
    ['/brand/angular.png', /image\/png/],
    ['/brand/dotnet.svg', /image\/svg\+xml/],
    ['/brand/angular-dotnet-waves.svg', /image\/svg\+xml/],
  ]) {
    const response = await fetch(new URL(asset, `${origin}/`))
    assert.equal(response.status, 200)
    assert.match(response.headers.get('content-type'), contentType)
    assert.ok((await response.arrayBuffer()).byteLength > 0)
  }
  for (const [path, expected] of [
    ['/version.json', { app: 'app-service-builder-angular-dotnet-web' }],
    ['/api/health', { status: 'ok', app: 'app-service-builder-angular-dotnet-api' }],
    ['/api/status', { status: 'available', app: 'app-service-builder-angular-dotnet-api' }],
    ['/api/version', { app: 'app-service-builder-angular-dotnet-api', framework: 'ASP.NET Core' }],
    ['/api/request', { method: 'GET', path: '/api/request' }],
  ]) {
    const response = await fetch(new URL(path, origin))
    assert.equal(response.status, 200)
    assert.match(response.headers.get('content-type'), /application\/json/)
    const body = await response.json()
    for (const [key, value] of Object.entries(expected)) assert.equal(body[key], value, `${path}: ${key}`)
  }
  const echo = await fetch(new URL('/api/echo', origin), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: 'hello' }),
  })
  assert.equal(echo.status, 200)
  assert.deepEqual(await echo.json(), { message: 'hello', received: true })
  const missing = await fetch(new URL('/api/missing', origin))
  assert.equal(missing.status, 404)
  assert.match(missing.headers.get('content-type'), /application\/json/)
  assert.deepEqual(await missing.json(), {
    error: 'not_found',
    message: 'The requested API route does not exist.',
  })
})
