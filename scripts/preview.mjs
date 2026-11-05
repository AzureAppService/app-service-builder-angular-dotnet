import { readdir, readFile } from 'node:fs/promises'
import { createServer, request as proxyRequest } from 'node:http'
import { extname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
}

export async function createPreviewServer(apiTarget) {
  const target = new URL(apiTarget)
  if (target.protocol !== 'http:') {
    throw new Error('The local API preview target must use http://.')
  }
  const root = fileURLToPath(new URL('../web/dist/web/browser/', import.meta.url))
  const entries = await readdir(root, { recursive: true, withFileTypes: true })
  const files = new Map(await Promise.all(entries.filter((entry) => entry.isFile()).map(async (entry) => {
    const path = join(entry.parentPath, entry.name)
    return [`/${relative(root, path).split(sep).join('/')}`, {
      body: await readFile(path),
      contentType: contentTypes[extname(path)] ?? 'application/octet-stream',
    }]
  })))
  const index = files.get('/index.html')
  if (!index) throw new Error('Build the Angular frontend before starting the preview.')

  return createServer((request, response) => {
    const incoming = new URL(request.url, 'http://127.0.0.1')
    if (incoming.pathname === '/api' || incoming.pathname.startsWith('/api/')) {
      const upstreamUrl = new URL(target)
      upstreamUrl.pathname = incoming.pathname
      upstreamUrl.search = incoming.search
      const fail = (error) => {
        console.error(`API proxy failed: ${error.message}`)
        if (response.headersSent) response.destroy(error)
        else response.writeHead(502, { 'content-type': 'application/json' }).end('{"error":"api_unavailable"}')
      }
      const upstream = proxyRequest(upstreamUrl, {
        method: request.method,
        headers: request.headers,
      }, (result) => {
        response.writeHead(result.statusCode, result.headers)
        result.on('error', fail)
        result.pipe(response)
      })
      upstream.on('error', fail)
      request.on('aborted', () => upstream.destroy())
      request.pipe(upstream)
      return
    }

    const file = files.get(incoming.pathname) ?? index
    response.writeHead(200, { 'content-type': file.contentType }).end(file.body)
  })
}

if (import.meta.main) {
  const server = await createPreviewServer(process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:18093')
  server.on('error', (error) => { throw error })
  server.listen(8080, '127.0.0.1', () => {
    console.log('Built Angular preview: http://127.0.0.1:8080/')
  })
}
