import 'fastify'
import { Server } from 'socket.io'
import { Namespace } from '.'

declare module 'fastify' {
  interface FastifyInstance {
    io: Server<{
      pong: () => void
      list_namespaces: (namespaces: Namespace[]) => void
    }>
  }
}
