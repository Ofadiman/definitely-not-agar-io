import Fastify from 'fastify'
import fastifySocketIO from 'fastify-socket.io'

export type Namespace = {
  name: string
  imageSrc: string
}

const namespaces: Namespace[] = [
  {
    name: 'roads',
    imageSrc:
      'https://fastly.picsum.photos/id/549/200/200.jpg?hmac=8HshVdK-H52hgb-zHj3AefpzafjOnwnqSPzsd0oFoDQ',
  },
  {
    name: 'cities',
    imageSrc:
      'https://fastly.picsum.photos/id/122/200/200.jpg?hmac=AO77fWXJ61xiBlRhsCVFnWdzhJoxbrUP8288wd3Wdmg',
  },
  {
    name: 'dogs',
    imageSrc:
      'https://fastly.picsum.photos/id/1062/200/200.jpg?hmac=F_trr44XLYeth1u5FIqJIgtD4pR7WOlzKZ2xrQ3tzww',
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

fastify.get('/health', async (request, reply) => {
  reply.send({ status: 'ok' })
})

fastify.ready().then(() => {
  fastify.io.on('connection', (socket) => {
    socket.emit('list_namespaces', namespaces)
  })
})

const PORT = 3000
fastify.listen({ port: PORT }).then(() => {
  fastify.log.info(`fastify is listening on port ${PORT}`)
})
