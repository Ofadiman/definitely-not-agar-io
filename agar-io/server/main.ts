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
import { GAME_SETTINGS } from '../shared/settings'
import { Player, PlayerConfig, PlayerData } from '../shared/player'

declare module 'fastify' {
  interface FastifyInstance {
    io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
  }
}

const createInitialOrbs = (orbsCount: number) => {
  const orbs: Orb[] = []
  for (let i = 0; i < orbsCount; i++) {
    orbs.push(new Orb())
  }
  return orbs
}
const orbs = createInitialOrbs(GAME_SETTINGS.DEFAULT_NUMBER_OF_ORBS)
const players: Player[] = []

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

    socket.on('initClient', (username) => {
      const playerConfig = new PlayerConfig()
      const playerData = new PlayerData(username)
      const player = new Player({
        socketId: socket.id,
        data: playerData,
        config: playerConfig,
      })
      players.push(player)

      socket.emit('initServer', { orbs, player })
    })
  })
})

server.listen({ host: '0.0.0.0', port: 3000 })
