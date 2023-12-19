import Fastify from 'fastify'
import fastifySocketIO from 'fastify-socket.io'

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
    fastify.log.info({ socketId: socket.id })
  })
})

const PORT = 3000
fastify.listen({ port: PORT }).then(() => {
  fastify.log.info(`fastify is listening on port ${PORT}`)
})
