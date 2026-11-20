import { readFile, stat } from 'node:fs/promises'
import {
  createServer as createHttpServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http'
import { extname, resolve, sep } from 'node:path'

type ServerOptions = {
  staticDir?: string
  apiPrefix?: string
}

const CONTENT_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

export function createServer(options: ServerOptions = {}): Server {
  const staticDir = options.staticDir ? resolve(options.staticDir) : undefined
  const apiPrefix = options.apiPrefix?.replace(/\/+$/, '')

  return createHttpServer((request, response) => {
    void handleRequest(request, response, staticDir, apiPrefix)
  })
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  staticDir: string | undefined,
  apiPrefix: string | undefined,
): Promise<void> {
  try {
    const url = new URL(request.url ?? '/', 'http://localhost')
    const isApiRequest = apiPrefix
      ? url.pathname === apiPrefix || url.pathname.startsWith(`${apiPrefix}/`)
      : false

    let pathname = url.pathname
    if (isApiRequest && apiPrefix) {
      pathname = pathname.slice(apiPrefix.length) || '/'
    }

    if (request.method === 'GET' && pathname === '/reserve') {
      response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
      response.end('Reserved')
      return
    }

    if (
      isApiRequest ||
      !staticDir ||
      (request.method !== 'GET' && request.method !== 'HEAD')
    ) {
      sendNotFound(response)
      return
    }

    await serveStaticFile(pathname, request.method === 'HEAD', response, staticDir)
  } catch {
    sendNotFound(response)
  }
}

async function serveStaticFile(
  pathname: string,
  headOnly: boolean,
  response: ServerResponse,
  staticDir: string,
): Promise<void> {
  let decodedPath: string
  try {
    decodedPath = decodeURIComponent(pathname)
  } catch {
    sendNotFound(response)
    return
  }

  const relativePath = decodedPath.replace(/^\/+/, '')
  const requestedPath = resolve(staticDir, relativePath)
  if (requestedPath !== staticDir && !requestedPath.startsWith(`${staticDir}${sep}`)) {
    sendNotFound(response)
    return
  }

  let filePath = requestedPath
  try {
    const info = await stat(filePath)
    if (info.isDirectory()) {
      filePath = resolve(filePath, 'index.html')
    }
  } catch {
    if (extname(decodedPath)) {
      sendNotFound(response)
      return
    }
    filePath = resolve(staticDir, 'index.html')
  }

  try {
    const body = await readFile(filePath)
    const contentType = CONTENT_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream'
    response.writeHead(200, { 'Content-Type': contentType })
    response.end(headOnly ? undefined : body)
  } catch {
    sendNotFound(response)
  }
}

function sendNotFound(response: ServerResponse): void {
  if (response.headersSent) {
    response.end()
    return
  }
  response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
  response.end('Not Found')
}
