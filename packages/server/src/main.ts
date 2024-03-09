import fastify from 'fastify'
import fastifyIO from 'fastify-socket.io'
import { Game, Orb, Player, createOrb, loop } from 'shared'
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

declare module 'fastify' {
  interface FastifyInstance {
    io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
    gameSettings: GameSettings
  }
}

const createInitialOrbs = (gameSettings: GameSettings, orbsCount: number): Record<string, Orb> => {
  const orbs: Record<string, Orb> = {}
  for (let i = 0; i < orbsCount; i++) {
    const orb = createOrb(gameSettings)
    orbs[orb.id] = orb
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
    orbs: createInitialOrbs(server.gameSettings, server.env.NUMBER_OF_ORBS),
    settings: server.gameSettings,
  }

  let cancelGameLoop: () => void

  type MoveTo = {
    x: number
    y: number
  }

  const botActions: Record<string, MoveTo> = {}

  server.io.on('connect', (socket) => {
    socket.join('game')

    socket.on('join_game', (data) => {
      if (Object.keys(game.players).length === 0) {
        cancelGameLoop = loop({
          fps: server.gameSettings.fps,
          callback: () => {
            Object.values(game.players).forEach((player) => {
              const consumedOrbId = checkForOrbCollisions(player, game.orbs, server.gameSettings)
              if (consumedOrbId !== null) {
                delete game.orbs[consumedOrbId]

                const newOrb = createOrb(server.gameSettings)

                game.orbs[newOrb.id] = newOrb

                server.io.to('game').emit('consume_orb', { consumedOrbId, newOrb })
              }

              const consumedPlayerId = checkForPlayerCollisions(
                player,
                game.players,
                server.gameSettings,
              )

              if (consumedPlayerId) {
                const consumedPlayer = game.players[consumedPlayerId]
                if (!consumedPlayer) {
                  return
                }

                consumedPlayer.snapshot.state = 'dead'

                server.io.to('game').emit('consume_player', {
                  consumedById: player.snapshot.socketId,
                  consumedPlayerId,
                })
              }

              const moveTo = botActions[player.snapshot.socketId]
              if (!moveTo) {
                return
              }

              const distX = moveTo.x - player.snapshot.location.x
              const distY = moveTo.y - player.snapshot.location.y
              const distance = Math.sqrt(distX * distX + distY * distY)
              // If bot is close to its target location update its target location to ensure smooth movement.
              if (distance <= 2) {
                player.snapshot.location.x = moveTo.x
                player.snapshot.location.y = moveTo.y
                botActions[player.snapshot.socketId] = {
                  x: faker.number.int({ min: 0, max: server.gameSettings.map.width }),
                  y: faker.number.int({ min: 0, max: server.gameSettings.map.height }),
                }
              } else {
                // TODO: Replace "1" with calculated player speed.
                const factor = 1 / distance
                player.snapshot.location.x = player.snapshot.location.x + factor * distX
                player.snapshot.location.y = player.snapshot.location.y + factor * distY
              }
            })

            server.io.to('game').emit('game_tick', D.map(game.players, Player.toSnapshot))
          },
        })

        const bots = createBots(server.gameSettings, server.env.NUMBER_OF_BOTS)
        game.players = bots
        Object.values(bots).forEach((bot) => {
          botActions[bot.snapshot.socketId] = {
            x: faker.number.int({ min: 0, max: server.gameSettings.map.width }),
            y: faker.number.int({ min: 0, max: server.gameSettings.map.height }),
          }
        })
      }

      game.players[socket.id] = Player.new({
        gameSettings: server.gameSettings,
        socketId: socket.id,
        username: data.name,
        type: 'human',
      })

      socket.emit('game_state', {
        orbs: game.orbs,
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

      const radius = player.radius(server.gameSettings)

      // TODO: Replace "1" with calculated player speed.
      player.snapshot.location.x += 1 * vector.x
      if (player.snapshot.location.x - radius < 0 && player.snapshot.vector.x < 0) {
        player.snapshot.location.x = 0 + radius
      }
      if (
        player.snapshot.location.x + radius > server.gameSettings.map.width &&
        player.snapshot.vector.x > 0
      ) {
        player.snapshot.location.x = server.gameSettings.map.width - radius
      }

      // TODO: Replace "1" with calculated player speed.
      player.snapshot.location.y -= 1 * vector.y
      if (player.snapshot.location.y - radius < 0 && player.snapshot.vector.y > 0) {
        player.snapshot.location.y = 0 + radius
      } else if (
        player.snapshot.location.y + radius > server.gameSettings.map.height &&
        vector.y < 0
      ) {
        player.snapshot.location.y = server.gameSettings.map.height - radius
      }

      const orbId = checkForOrbCollisions(player, game.orbs, server.gameSettings)
      if (orbId) {
        delete game.orbs[orbId]

        const newOrb = createOrb(server.gameSettings)

        game.orbs[newOrb.id] = newOrb

        server.io.to('game').emit('consume_orb', { consumedOrbId: orbId, newOrb })
      }

      const consumedPlayerId = checkForPlayerCollisions(player, game.players, server.gameSettings)
      if (consumedPlayerId) {
        delete game.players[consumedPlayerId]

        server.io
          .to('game')
          .emit('consume_player', { consumedById: player.snapshot.socketId, consumedPlayerId })
      }
    })

    socket.on('disconnect', () => {
      const humanPlayersLeftCount = Object.values(game.players).reduce((acc, player) => {
        if (player.isHuman()) {
          return acc + 1
        }
        return acc
      }, 0)

      const lastPlayerDisconnected = humanPlayersLeftCount === 1
      if (lastPlayerDisconnected) {
        game.players = {}
        game.orbs = createInitialOrbs(server.gameSettings, server.env.NUMBER_OF_ORBS)

        if (cancelGameLoop) {
          cancelGameLoop()
        }
      } else {
        delete game.players[socket.id]
      }
    })
  })
})

server.listen({ host: '0.0.0.0', port: 3000 })
