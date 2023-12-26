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
let intervalId: NodeJS.Timeout | null = null

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

  let player: Player

  server.io.on('connect', (socket) => {
    socket.join('game')
    console.log('socket connected')

    socket.on('initClient', (username) => {
      if (players.length === 0) {
        intervalId = setInterval(() => {
          server.io.to('game').emit('tick', players)
        }, 1000 / 30)
      }

      const playerConfig = new PlayerConfig()
      const playerData = new PlayerData(username)
      player = new Player({
        socketId: socket.id,
        data: playerData,
        config: playerConfig,
      })
      players.push(player)

      socket.emit('initServer', { orbs, player })
    })

    socket.on('tock', (data) => {
      if (player === undefined) {
        return
      }

      player.state.config.xVector = data.xVector
      player.state.config.yVector = data.yVector

      if (
        (player.state.data.locX < 0 && data.xVector < 0) ||
        (player.state.data.locX > GAME_SETTINGS.MAP_WIDTH && data.xVector > 0)
      ) {
        player.state.data.locY -= player.state.config.speed * data.yVector
      } else if (
        (player.state.data.locY < 0 && data.yVector > 0) ||
        (player.state.data.locY > GAME_SETTINGS.MAP_HEIGHT && data.yVector < 0)
      ) {
        player.state.data.locX += player.state.config.speed * data.xVector
      } else {
        player.state.data.locX += player.state.config.speed * data.xVector
        player.state.data.locY -= player.state.config.speed * data.yVector
      }
    })

    socket.on('disconnect', () => {
      if (players.length === 0) {
        if (intervalId !== null) {
          clearInterval(intervalId)
        }
      }
    })
  })
})

server.listen({ host: '0.0.0.0', port: 3000 })
