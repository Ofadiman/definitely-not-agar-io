import Fastify from 'fastify'

const fastify = Fastify({
  logger: true,
})

fastify.get('/health', async (request, reply) => {
  reply.send({ status: 'ok' })
})

const PORT = 3000
fastify.listen({ port: PORT }).then(() => {
  fastify.log.info(`fastify is listening on port ${PORT}`)
})
