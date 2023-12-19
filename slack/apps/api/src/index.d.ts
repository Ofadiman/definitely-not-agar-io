import 'fastify'
import { Server } from 'socket.io'

declare module 'fastify' {
  interface FastifyInstance {
    io: Server<{
      pong: () => void
    }>
  }
}

export declare const FOO: string
declare function typeDefs(): void
