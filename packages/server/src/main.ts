import fastify from 'fastify'
import fastifyIO from 'fastify-socket.io'
import { Game, Orb, Player, loop } from 'shared'
import { Server } from 'socket.io'
import {
  GameSettings,
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from 'shared'
import { checkForOrbCollisions, checkForPlayerCollisions } from './collisions'
import { faker } from '@faker-js/faker'
import { D } from '@mobily/ts-belt'
import { gameSettingsPlugin } from './plugins/gameSettings.plugin'
import { envPlugin } from './plugins/env.plugin'
import { drawWinner } from './utils'

declare module 'fastify' {
  interface FastifyInstance {
    io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
    gameSettings: GameSettings
  }
}

const createInitialOrbs = (gameSettings: GameSettings, orbsCount: number): Record<string, Orb> => {
  const orbs: Record<string, Orb> = {}
  for (let i = 0; i < orbsCount; i++) {
    const orb = Orb.new({ gameSettings })
    orbs[orb.snapshot.id] = orb
  }
  return orbs
}

const createBots = (gameSettings: GameSettings, botsCount: number): Record<string, Player> => {
  const bots: Record<string, Player> = {}
  for (let i = 0; i < botsCount; i++) {
    const bot = Player.new({
      gameSettings,
      type: 'bot',
      socketId: faker.string.uuid(),
      username: `bot: ${faker.person.firstName()}`,
    })
    bots[bot.snapshot.socketId] = bot
  }
  return bots
}

const server = fastify({
  logger: true,
  disableRequestLogging: true,
})

server.register(envPlugin)
server.register(gameSettingsPlugin)

server.register(fastifyIO, {
  cors: {
    origin: 'http://localhost:5173',
  },
})

server.get('/', () => {
  return { status: 'ok' }
})

server.ready().then(() => {
  const game: Game = {
    players: {},
    orbs: {},
    settings: server.gameSettings,
  }

  let cancelGameLoop: () => void

  server.io.on('connect', (socket) => {
    socket.join('game')

    socket.on('join_game', (data) => {
      const humanPlayersCount = Object.values(game.players).reduce((acc, player) => {
        if (player.isHuman()) {
          return acc + 1
        }
        return acc
      }, 0)

      if (humanPlayersCount === 0) {
        game.players = createBots(server.gameSettings, server.env.NUMBER_OF_BOTS)
        game.orbs = createInitialOrbs(server.gameSettings, server.env.NUMBER_OF_ORBS)

        cancelGameLoop = loop({
          fps: server.gameSettings.fps,
          callback: () => {
            Object.values(game.players).forEach((player) => {
              if (player.isDead()) {
                return
              }

              player.move(server.gameSettings, server.env.INITIAL_PLAYER_SPEED)

              const orbId = checkForOrbCollisions(player, game.orbs, server.gameSettings)
              if (orbId) {
                const consumedOrb = game.orbs[orbId]
                if (!consumedOrb) {
                  return
                }

                player.snapshot.absorbedOrbsCount++
                consumedOrb.relocate({ gameSettings: server.gameSettings })

                server.io.to('game').emit('consume_orb', Orb.toSnapshot(consumedOrb))
              }

              const consumedPlayerId = checkForPlayerCollisions(
                player,
                game.players,
                server.gameSettings,
              )

              if (consumedPlayerId) {
                const consumedPlayer = game.players[consumedPlayerId]
                if (consumedPlayer) {
                  player.snapshot.absorbedOrbsCount += consumedPlayer.snapshot.absorbedOrbsCount

                  consumedPlayer.snapshot.state = 'dead'

                  server.io.to('game').emit('consume_player', {
                    consumedById: player.snapshot.socketId,
                    consumedPlayerId,
                  })
                }
              }
            })

            server.io.to('game').emit('game_tick', D.map(game.players, Player.toSnapshot))

            const winner = drawWinner(game)
            if (winner) {
              cancelGameLoop()
              server.io.to('game').emit('draw_winner', { winnerId: winner.snapshot.socketId })
            }
          },
        })
      }

      game.players[socket.id] = Player.new({
        gameSettings: server.gameSettings,
        socketId: socket.id,
        username: data.name,
        type: 'human',
      })

      socket.emit('game_state', {
        orbs: D.map(game.orbs, Orb.toSnapshot),
        players: D.map(game.players, Player.toSnapshot),
        settings: game.settings,
      })
    })

    socket.on('update_player_vector', (vector) => {
      const player = game.players[socket.id]
      if (player === undefined) {
        return
      }

      player.snapshot.vector.x = vector.x
      player.snapshot.vector.y = vector.y
    })

    socket.on('disconnect', () => {
      delete game.players[socket.id]

      const humanPlayersCount = Object.values(game.players).reduce((acc, player) => {
        if (player.isHuman()) {
          return acc + 1
        }
        return acc
      }, 0)

      const lastPlayerDisconnected = humanPlayersCount === 0
      if (lastPlayerDisconnected) {
        if (cancelGameLoop) {
          cancelGameLoop()
        }
      }
    })
  })
})

server.listen({ host: '0.0.0.0', port: 3000 })
