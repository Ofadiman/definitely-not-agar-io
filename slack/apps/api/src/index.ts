import Fastify from 'fastify'
import fastifySocketIO from 'fastify-socket.io'
import { Namespace } from 'shared'
import { faker } from '@faker-js/faker'
import { Socket } from 'socket.io'

const namespaces: Namespace[] = [
  {
    name: 'roads',
    endpoint: '/roads',
    id: '29989651-60a4-4463-bcf1-689ba3c65f0f',
    imageSrc:
      'https://fastly.picsum.photos/id/549/200/200.jpg?hmac=8HshVdK-H52hgb-zHj3AefpzafjOnwnqSPzsd0oFoDQ',
    rooms: [
      {
        id: 'f73897e4-480f-4690-a43a-423c4bec90d8',
        title: 'poland',
        history: [],
        isPrivate: false,
        namespaceId: '29989651-60a4-4463-bcf1-689ba3c65f0f',
      },
      {
        id: '363048de-973b-4c5a-915b-266e9bd72580',
        title: 'germany',
        history: [],
        isPrivate: false,
        namespaceId: '29989651-60a4-4463-bcf1-689ba3c65f0f',
      },
      {
        id: 'add6d4f1-dab7-4f00-9b22-e16b64a76190',
        title: 'france',
        history: [],
        isPrivate: false,
        namespaceId: '29989651-60a4-4463-bcf1-689ba3c65f0f',
      },
    ],
  },
  {
    endpoint: '/cities',
    id: 'aac0c753-a936-4c98-928c-7c941902556e',
    name: 'cities',
    imageSrc:
      'https://fastly.picsum.photos/id/122/200/200.jpg?hmac=AO77fWXJ61xiBlRhsCVFnWdzhJoxbrUP8288wd3Wdmg',
    rooms: [
      {
        id: '473aeae0-1e04-4239-a08f-734de2e335dc',
        title: 'warsaw',
        history: [],
        isPrivate: false,
        namespaceId: 'aac0c753-a936-4c98-928c-7c941902556e',
      },
      {
        id: '7aa47504-f162-4290-8c3d-40df914c93be',
        title: 'cracow',
        history: [],
        isPrivate: false,
        namespaceId: 'aac0c753-a936-4c98-928c-7c941902556e',
      },
      {
        id: 'ca9e4de6-e30e-4913-b2aa-799331b75928',
        title: 'gdansk',
        history: [],
        isPrivate: false,
        namespaceId: 'aac0c753-a936-4c98-928c-7c941902556e',
      },
    ],
  },
]

const fastify = Fastify({
  logger: true,
  disableRequestLogging: true,
})

fastify.register(fastifySocketIO, {
  cors: {
    origin: 'http://localhost:5173',
  },
})

fastify.get('/ping', () => {
  fastify.io.emit('pong')
})

fastify.get('/health', async (_, reply) => {
  reply.send({ status: 'ok' })
})

fastify.get('/namespaces/:namespaceId', (request, reply) => {
  const namespace = namespaces.find(
    (namespace) => namespace.id === (request.params as any).namespaceId,
  )

  if (namespace) {
    namespace.rooms.push({
      id: faker.string.uuid(),
      namespaceId: namespace.id,
      title: faker.word.noun(),
      history: [],
      isPrivate: false,
    })

    fastify.io.of(namespace.endpoint).emit('namespace:changed', namespace)
    reply.send()
  } else {
    throw new Error(`namespace not found`)
  }
})

fastify.ready().then(() => {
  fastify.io.of('/').on('connection', (socket) => {
    socket.emit('list_namespaces', namespaces)
  })

  namespaces.forEach((namespace) => {
    fastify.io.of(namespace.endpoint).on('connection', (socket: Socket) => {
      fastify.log.info(`socket with id: ${socket.id} connected`)

      socket.on('rooms:join', (roomId) => {
        fastify.log.info({ roomId }, `rooms:join`)
        socket.join(roomId)
      })
    })
  })
})

const PORT = 3000
void fastify.listen({ port: PORT })
