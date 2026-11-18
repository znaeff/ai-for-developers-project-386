import { createServer as createHttpServer, type Server } from 'node:http'

export function createServer(): Server {
  return createHttpServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost')

    if (request.method === 'GET' && url.pathname === '/reserve') {
      response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
      response.end('Reserved')
      return
    }

    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end('Not Found')
  })
}
