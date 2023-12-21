import 'fastify'
import { Server } from 'socket.io'
import { Namespace } from 'shared'

interface ClientToServerEvents {
  'rooms:join': (roomId: string) => void
}

interface ServerToClientEvents {
  pong: () => void
  list_namespaces: (namespaces: Namespace[]) => void
  'namespace:changed': (namespaces: Namespace) => void
}

declare module 'fastify' {
  interface FastifyInstance {
    io: Server<ClientToServerEvents, ServerToClientEvents>
  }
}
