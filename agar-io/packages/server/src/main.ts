import fastify from 'fastify'
import fastifyIO from 'fastify-socket.io'
import { Game, Orb, createOrb, createPlayer } from 'shared'
import { Server } from 'socket.io'
import {
  GAME_SETTINGS,
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from 'shared'
import { checkForOrbCollisions, checkForPlayerCollisions } from './collisions'

declare module 'fastify' {
  interface FastifyInstance {
    io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
  }
}

const createInitialOrbs = (orbsCount: number): Record<string, Orb> => {
  const orbs: Record<string, Orb> = {}
  for (let i = 0; i < orbsCount; i++) {
    const orb = createOrb()
    orbs[orb.id] = orb
  }
  return orbs
}

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

const game: Game = {
  players: {},
  orbs: createInitialOrbs(GAME_SETTINGS.DEFAULT_NUMBER_OF_ORBS),
}

server.ready().then(() => {
  server.io.on('connect', (socket) => {
    socket.join('game')

    socket.on('joinGame', (data) => {
      if (Object.keys(game.players).length === 0) {
        intervalId = setInterval(() => {
          server.io.to('game').emit('tick', game.players)
        }, 1000 / 30)
      }

      game.players[socket.id] = createPlayer({ socketId: socket.id, name: data.name })

      socket.emit('gameState', game)
    })

    socket.on('tock', (vector) => {
      const player = game.players[socket.id]
      if (player === undefined) {
        return
      }

      player.vector.x = vector.x
      player.vector.y = vector.y

      if (
        (player.location.x > 0 && vector.x < 0) ||
        (player.location.x < GAME_SETTINGS.MAP_WIDTH && vector.x > 0)
      ) {
        player.location.x += player.speed * vector.x
      }

      if (
        (player.location.y > 0 && vector.y > 0) ||
        (player.location.y < GAME_SETTINGS.MAP_HEIGHT && vector.y < 0)
      ) {
        player.location.y -= player.speed * vector.y
      }

      const orbId = checkForOrbCollisions(player, game.orbs)
      if (orbId !== null) {
        delete game.orbs[orbId]

        const newOrb = createOrb()

        game.orbs[newOrb.id] = newOrb

        server.io.to('game').emit('orbConsumed', { consumedOrbId: orbId, newOrb })
      }

      const consumedPlayerId = checkForPlayerCollisions(player, game.players)

      if (consumedPlayerId) {
        server.io.to('game').emit('playerConsumed', { consumedById: player.id, consumedPlayerId })
        delete game.players[consumedPlayerId]
      }
    })

    socket.on('disconnect', () => {
      delete game.players[socket.id]

      if (Object.keys(game.players).length === 0 && intervalId !== null) {
        clearInterval(intervalId)
      }
    })
  })
})

server.listen({ host: '0.0.0.0', port: 3000 })
