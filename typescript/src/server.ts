import fastify from 'fastify'
import fastifySocketIO from 'fastify-socket.io'

const server = fastify({
  logger: true,
  disableRequestLogging: true,
})

server.register(fastifySocketIO, {
  cors: {
    origin: 'http://localhost:3000',
  },
})

server.get('/ping', async () => {
  return { message: 'pong' }
})

server.ready().then(() => {
  /**
   * Example of event typing on default namespace.
   */
  server.io.on('connection', async (socket) => {
    server.log.info({ socketId: socket.id }, 'socket id')

    socket.on('hello', (data) => {
      server.log.info({ foo: data.foo, bar: data.bar })
    })

    socket.emit('noArguments')
    socket.emit('objectArguments', { foo: 'foo', bar: 0 })
    socket.emit('objectArgumentsWithAcknowledgement', { foo: 'foo', bar: 0 }, (data) => {
      server.log.info({ foo: data.foo, bar: data.bar })
    })
    const data = await socket.emitWithAck('objectArgumentsWithAcknowledgement', {
      foo: 'foo',
      bar: 0,
    })
    server.log.info({ foo: data.foo, bar: data.bar })
  })

  /**
   * Example of event typing on custom namespace.
   */
  server.io.of('/namespace').on('connection', async (socket) => {
    socket.on('hello', (data) => {
      server.log.info({ foo: data.foo, bar: data.bar }, 'typed data')
    })

    socket.emit('noArguments')
    socket.emit('objectArguments', { foo: 'foo', bar: 0 })
    socket.emit('objectArgumentsWithAcknowledgement', { foo: 'foo', bar: 0 }, (data) => {
      server.log.info({ foo: data.foo, bar: data.bar })
    })
    const data = await socket.emitWithAck('objectArgumentsWithAcknowledgement', {
      foo: 'foo',
      bar: 0,
    })
    server.log.info({ foo: data.foo, bar: data.bar })
  })
})

server.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) {
    server.log.error(err, 'something went wrong')
    process.exit(1)
  }
})
