import fastify from 'fastify'

const server = fastify({
  logger: true,
  disableRequestLogging: true,
})

server.get('/ping', async () => {
  return { message: 'pong' }
})

server.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) {
    server.log.error(err, 'something went wrong')
    process.exit(1)
  }
})
