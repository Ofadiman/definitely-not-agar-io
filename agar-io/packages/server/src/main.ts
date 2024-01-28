import fastify from 'fastify'
import fastifyIO from 'fastify-socket.io'
import { Game, Orb, Player, createOrb, createPlayer, fps, loop } from 'shared'
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
    const bot = createPlayer({
      isBot: true,
      socketId: faker.string.uuid(),
      name: `bot: ${faker.person.firstName()}`,
    })
    bots[bot.socketId] = bot
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

    socket.on('joinGame', (data) => {
      if (Object.keys(game.players).length === 0) {
        cancelGameLoop = loop({
          fps: GAME_SETTINGS.FPS,
          callback: () => {
            Object.values(game.players).forEach((player) => {
              if (player.isBot === false) {
                return
              }

              const consumedOrbId = checkForOrbCollisions(player, game.orbs)
              if (consumedOrbId !== null) {
                delete game.orbs[consumedOrbId]

                const newOrb = createOrb()

                game.orbs[newOrb.id] = newOrb

                server.io.to('game').emit('orbConsumed', { consumedOrbId, newOrb })
              }

              const consumedPlayerId = checkForPlayerCollisions(player, game.players)
              if (consumedPlayerId) {
                const consumedPlayer = game.players[consumedPlayerId]
                if (!consumedPlayer) {
                  return
                }

                if (consumedPlayer.isBot) {
                  delete game.players[consumedPlayerId]
                  delete botActions[consumedPlayerId]

                  const newBot = createPlayer({
                    isBot: true,
                    socketId: faker.string.uuid(),
                    name: `bot: ${faker.person.firstName()}`,
                  })
                  const newBotAction: MoveTo = {
                    x: faker.number.int({ min: 0, max: GAME_SETTINGS.MAP_WIDTH }),
                    y: faker.number.int({ min: 0, max: GAME_SETTINGS.MAP_HEIGHT }),
                  }

                  game.players[newBot.socketId] = newBot
                  botActions[newBot.socketId] = newBotAction
                } else {
                  consumedPlayer.isAlive = false
                }

                server.io
                  .to('game')
                  .emit('playerConsumed', { consumedById: player.socketId, consumedPlayerId })
              }

              const moveTo = botActions[player.socketId]
              if (!moveTo) {
                return
              }

              const distX = moveTo.x - player.location.x
              const distY = moveTo.y - player.location.y
              const distance = Math.sqrt(distX * distX + distY * distY)
              // 2 is arbitrary number here because I can't figure out what it should be.
              if (distance <= 2) {
                player.location.x = moveTo.x
                player.location.y = moveTo.y
                botActions[player.socketId] = {
                  x: faker.number.int({ min: 0, max: GAME_SETTINGS.MAP_WIDTH }),
                  y: faker.number.int({ min: 0, max: GAME_SETTINGS.MAP_HEIGHT }),
                }
              } else {
                const factor = player.speed / distance
                player.location.x = player.location.x + factor * distX
                player.location.y = player.location.y + factor * distY
              }
            })

            server.io.to('game').emit('tick', game.players)
          },
        })

        const bots = createBots(50)
        game.players = bots
        Object.values(bots).forEach((bot) => {
          botActions[bot.socketId] = {
            x: faker.number.int({ min: 0, max: GAME_SETTINGS.MAP_WIDTH }),
            y: faker.number.int({ min: 0, max: GAME_SETTINGS.MAP_HEIGHT }),
          }
        })
      }

      game.players[socket.id] = createPlayer({ socketId: socket.id, name: data.name, isBot: false })

      socket.emit('gameState', game)
    })

    socket.on('tock', (vector) => {
      const player = game.players[socket.id]
      if (player === undefined) {
        return
      }

      if (player.isAlive === false) {
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
        const consumedPlayer = game.players[consumedPlayerId]
        if (!consumedPlayer) {
          return
        }

        if (consumedPlayer.isAlive === false) {
          return
        }

        consumedPlayer.isAlive = false
        server.io
          .to('game')
          .emit('playerConsumed', { consumedById: player.socketId, consumedPlayerId })
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
