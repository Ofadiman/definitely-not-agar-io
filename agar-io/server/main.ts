import fastify from 'fastify'

const app = async () => {
  const server = fastify()

  server.get('/', () => {
    return { status: 'ok' }
  })

  if (import.meta.env.PROD) {
    server.listen({ host: '0.0.0.0', port: 3000 })
  }

  return server
}

export const viteNodeApp = app()
