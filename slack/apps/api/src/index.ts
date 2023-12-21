import Fastify from 'fastify'
import fastifySocketIO from 'fastify-socket.io'
import {
  Namespace,
  Room,
  ClientToServerEvents,
  ServerToClientEvents,
  EVENTS,
  Message,
} from 'shared'
import cors from '@fastify/cors'
import { Socket, Namespace as SocketIONamespace } from 'socket.io'
import { allNamespaces, allRooms } from './data'

const fastify = Fastify({
  logger: true,
  disableRequestLogging: true,
})

fastify.register(cors, {
  origin: 'http://localhost:5173',
})

fastify.register(fastifySocketIO, {
  cors: {
    origin: 'http://localhost:5173',
  },
})

fastify.get('/health', async (_, reply) => {
  reply.send({ status: 'ok' })
})

fastify.get('/namespaces', () => {
  return allNamespaces
})

fastify.get('/namespaces/:namespaceId/rooms', (request) => {
  const namespaceId = (request.params as Record<string, string>).namespaceId

  const namespaceRooms = allRooms.filter((room) => room.namespaceId === namespaceId)

  return namespaceRooms
})

fastify.ready().then(() => {
  allNamespaces.forEach((namespace) => {
    const currentNamespace: SocketIONamespace<ClientToServerEvents, ServerToClientEvents, {}, {}> =
      fastify.io.of('/' + namespace.id)

    currentNamespace.on('connection', async (socket: Socket) => {
      fastify.log.info({ socketId: socket.id }, 'socket connected')

      socket.on(EVENTS.ROOMS_JOIN, async (roomId: string, callback) => {
        socket.rooms.forEach((room) => {
          socket.leave(room)
        })

        fastify.log.info({ roomId }, 'joining room id')
        socket.join(roomId)

        const socketsCount = await fastify.io
          .of('/' + namespace.id)
          .in(roomId)
          .fetchSockets()

        callback({
          socketsCount: socketsCount.length,
        })
      })

      socket.on(EVENTS.MESSAGES_SENT, async (message: Message) => {
        socket.in(message.roomId).emit(EVENTS.MESSAGES_SENT, message)
      })
    })
  })
})

const PORT = 3000
void fastify.listen({ port: PORT })
