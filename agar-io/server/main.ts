import fastify from 'fastify'
import fastifyIO from 'fastify-socket.io'
import { Orb } from '../shared/orb'
import { Server } from 'socket.io'
import {
  ClientToServerEvents,
  SocketData,
  InterServerEvents,
  ServerToClientEvents,
} from '../shared/types'

declare module 'fastify' {
  interface FastifyInstance {
    io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
  }
}

const createInitialOrbs = () => {
  const orbs: Orb[] = []
  for (let i = 0; i < 500; i++) {
    orbs.push(new Orb())
  }
  return orbs
}
const orbs = createInitialOrbs()

const server = fastify({
  logger: true,
  disableRequestLogging: true,
})

server.register(fastifyIO, {
  cors: {
    origin: 'http://localhost:5173',
  },
})

server.get('/', () => {
  return { status: 'ok' }
})

server.ready().then(() => {
  server.log.info('server.ready()')

  server.io.on('connect', (socket) => {
    console.log('socket connected')
    socket.emit('init', { orbs })
  })
})

server.listen({ host: '0.0.0.0', port: 3000 })
