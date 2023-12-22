import { Server } from 'socket.io'
import { SocketData, InterServerEvents, ServerToClientEvents, ClientToServerEvents } from '../types'

declare module 'fastify' {
  interface FastifyInstance {
    io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
  }
}
