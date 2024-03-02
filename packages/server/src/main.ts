import fastify from 'fastify'
import fastifyIO from 'fastify-socket.io'
import { Game, Orb, Player, createOrb, loop } from 'shared'
import { Server } from 'socket.io'
import {
  GAME_SETTINGS,
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from 'shared'
import { checkForOrbCollisions, checkForPlayerCollisions } from './collisions'
import { faker } from '@faker-js/faker'
import { D } from '@mobily/ts-belt'

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

const createBots = (playersCount: number): Record<string, Player> => {
  const bots: Record<string, Player> = {}
  for (let i = 0; i < playersCount; i++) {
    const bot = Player.new({
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

let cancelGameLoop: () => void

type MoveTo = {
  x: number
  y: number
}

const botActions: Record<string, MoveTo> = {}

server.ready().then(() => {
  server.io.on('connect', (socket) => {
    socket.join('game')

    socket.on('join_game', (data) => {
      if (Object.keys(game.players).length === 0) {
        cancelGameLoop = loop({
          fps: GAME_SETTINGS.FPS,
          callback: () => {
            Object.values(game.players).forEach((player) => {
              if (player.isHuman()) {
                return
              }

              const consumedOrbId = checkForOrbCollisions(player, game.orbs)
              if (consumedOrbId !== null) {
                delete game.orbs[consumedOrbId]

                const newOrb = createOrb()

                game.orbs[newOrb.id] = newOrb

                server.io.to('game').emit('consume_orb', { consumedOrbId, newOrb })
              }

              const consumedPlayerId = checkForPlayerCollisions(player, game.players)
              if (consumedPlayerId) {
                const consumedPlayer = game.players[consumedPlayerId]
                if (!consumedPlayer) {
                  return
                }

                if (consumedPlayer.isBot()) {
                  delete game.players[consumedPlayerId]
                  delete botActions[consumedPlayerId]

                  const newBot = Player.new({
                    type: 'bot',
                    socketId: faker.string.uuid(),
                    username: `bot: ${faker.person.firstName()}`,
                  })
                  const newBotAction: MoveTo = {
                    x: faker.number.int({ min: 0, max: GAME_SETTINGS.MAP_WIDTH }),
                    y: faker.number.int({ min: 0, max: GAME_SETTINGS.MAP_HEIGHT }),
                  }

                  game.players[newBot.snapshot.socketId] = newBot
                  botActions[newBot.snapshot.socketId] = newBotAction
                }

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
                  x: faker.number.int({ min: 0, max: GAME_SETTINGS.MAP_WIDTH }),
                  y: faker.number.int({ min: 0, max: GAME_SETTINGS.MAP_HEIGHT }),
                }
              } else {
                const factor = GAME_SETTINGS.DEFAULT_PLAYER_SPEED / distance
                player.snapshot.location.x = player.snapshot.location.x + factor * distX
                player.snapshot.location.y = player.snapshot.location.y + factor * distY
              }
            })

            server.io.to('game').emit('game_tick', D.map(game.players, Player.toSnapshot))
          },
        })

        const bots = createBots(GAME_SETTINGS.DEFAULT_NUMBER_OF_BOT_PLAYERS)
        game.players = bots
        Object.values(bots).forEach((bot) => {
          botActions[bot.snapshot.socketId] = {
            x: faker.number.int({ min: 0, max: GAME_SETTINGS.MAP_WIDTH }),
            y: faker.number.int({ min: 0, max: GAME_SETTINGS.MAP_HEIGHT }),
          }
        })
      }

      game.players[socket.id] = Player.new({
        socketId: socket.id,
        username: data.name,
        type: 'human',
      })

      socket.emit('game_state', {
        orbs: game.orbs,
        players: D.map(game.players, Player.toSnapshot),
      })
    })

    socket.on('update_player_vector', (vector) => {
      const player = game.players[socket.id]
      if (player === undefined) {
        return
      }

      player.snapshot.vector.x = vector.x
      player.snapshot.vector.y = vector.y

      const radius = player.radius()

      player.snapshot.location.x += GAME_SETTINGS.DEFAULT_PLAYER_SPEED * vector.x
      if (player.snapshot.location.x - radius < 0 && player.snapshot.vector.x < 0) {
        player.snapshot.location.x = 0 + radius
      }
      if (
        player.snapshot.location.x + radius > GAME_SETTINGS.MAP_WIDTH &&
        player.snapshot.vector.x > 0
      ) {
        player.snapshot.location.x = GAME_SETTINGS.MAP_WIDTH - radius
      }

      player.snapshot.location.y -= GAME_SETTINGS.DEFAULT_PLAYER_SPEED * vector.y
      if (player.snapshot.location.y - radius < 0 && player.snapshot.vector.y > 0) {
        player.snapshot.location.y = 0 + radius
      } else if (player.snapshot.location.y + radius > GAME_SETTINGS.MAP_HEIGHT && vector.y < 0) {
        player.snapshot.location.y = GAME_SETTINGS.MAP_HEIGHT - radius
      }

      const orbId = checkForOrbCollisions(player, game.orbs)
      if (orbId) {
        delete game.orbs[orbId]

        const newOrb = createOrb()

        game.orbs[newOrb.id] = newOrb

        server.io.to('game').emit('consume_orb', { consumedOrbId: orbId, newOrb })
      }

      const consumedPlayerId = checkForPlayerCollisions(player, game.players)
      if (consumedPlayerId) {
        delete game.players[consumedPlayerId]

        server.io
          .to('game')
          .emit('consume_player', { consumedById: player.snapshot.socketId, consumedPlayerId })
      }
    })

    socket.on('disconnect', () => {
      delete game.players[socket.id]

      if (Object.keys(game.players).length === 0 && cancelGameLoop !== null) {
        if (cancelGameLoop) {
          cancelGameLoop()
        }
      }
    })
  })
})

server.listen({ host: '0.0.0.0', port: 3000 })
